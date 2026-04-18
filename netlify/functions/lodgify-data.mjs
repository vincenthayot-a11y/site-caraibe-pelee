/**
 * Netlify Function : Proxy sécurisé vers l'API Lodgify
 * 
 * Cette fonction :
 * 1. Récupère la liste des propriétés (noms, descriptions, prix)
 * 2. Récupère les photos de chaque propriété en parallèle
 * 3. Renvoie le tout au site en JSON
 * 4. Cache le résultat 1h pour la performance
 * 
 * La clé API Lodgify est stockée en variable d'environnement (jamais exposée).
 * 
 * Variable d'environnement requise : LODGIFY_API_KEY
 */

const LODGIFY_BASE = "https://api.lodgify.com/v2";

// Mapping des villes vers les types/labels du site
const CITY_MAP = {
  "Le Carbet": { type: "carbet", label: "Le Carbet" },
  "Le Morne Rouge": { type: "morne", label: "Morne-Rouge" },
  "Saint-Pierre": { type: "stpierre", label: "Saint-Pierre" },
};

// Détection d'équipements depuis les amenities Lodgify
function mapAmenities(room) {
  const a = room.amenities || {};
  const found = [];

  if (room.bedrooms) found.push(`🛏 ${room.bedrooms} chambre${room.bedrooms > 1 ? 's' : ''}`);
  if (room.max_people) found.push(`👤 ${room.max_people} personne${room.max_people > 1 ? 's' : ''}`);

  // Terrasse/Balcon
  const rooms = a.room || [];
  if (rooms.some(r => r.name === 'RoomsTerrace' || r.name === 'RoomsBalcony')) found.push('☕ Terrasse');

  // Wifi
  if (room.has_wifi) found.push('📶 Wifi');

  // Clim
  const heating = a.heating || [];
  if (heating.some(h => h.name === 'HeatingACAirConditioning')) found.push('🌀 Climatisation');

  // Cuisine
  const cooking = a.cooking || [];
  if (cooking.length >= 3) found.push('🍳 Cuisine équipée');

  // Parking
  if (room.has_parking) found.push('🅿️ Parking');

  // Lave-linge
  const laundry = a.laundry || [];
  if (laundry.some(l => l.name === 'LaundryWashingMachine')) found.push('🧺 Lave-linge');

  return found.slice(0, 6); // Max 6 amenities
}

// Nettoyage HTML → texte
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

// Troncature intelligente à la phrase
function truncate(text, max = 320) {
  if (text.length <= max) return text;
  const cut = text.substring(0, max);
  const lastPunct = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'));
  if (lastPunct > max * 0.5) return cut.substring(0, lastPunct + 1).trim();
  return cut.substring(0, cut.lastIndexOf(' ')).trim() + '...';
}

// Normalise une URL photo Lodgify
function photoUrl(url, width = 1400) {
  if (!url) return '';
  let u = url.startsWith('//') ? 'https:' + url : url;
  return u.replace(/\?f=\d+/, `?w=${width}`).replace(/\?w=\d+/, `?w=${width}`);
}

export default async function handler(req) {
  const apiKey = process.env.LODGIFY_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "LODGIFY_API_KEY non configurée" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = {
    "X-ApiKey": apiKey,
    "accept": "application/json",
  };

  try {
    // 1. Récupérer la liste des propriétés
    const propsRes = await fetch(`${LODGIFY_BASE}/properties?includeInOut=false&size=50`, { headers });
    if (!propsRes.ok) throw new Error(`Lodgify properties: ${propsRes.status}`);
    const propsData = await propsRes.json();
    const properties = propsData.items || [];

    // 2. Récupérer les photos de chaque propriété EN PARALLÈLE
    const roomsPromises = properties.map(async (p) => {
      try {
        const res = await fetch(`${LODGIFY_BASE}/properties/${p.id}/rooms`, { headers });
        if (!res.ok) return { id: p.id, rooms: [] };
        const rooms = await res.json();
        return { id: p.id, rooms };
      } catch {
        return { id: p.id, rooms: [] };
      }
    });

    const allRooms = await Promise.all(roomsPromises);
    const roomsMap = {};
    for (const r of allRooms) {
      roomsMap[r.id] = r.rooms;
    }

    // 3. Assembler les données pour le site
    const bungalows = properties
      .filter(p => p.is_active)
      .map(p => {
        const cityInfo = CITY_MAP[p.city] || { type: 'autre', label: p.city };
        const desc = truncate(stripHtml(p.description));
        const room = (roomsMap[p.id] || [])[0] || {};
        const photos = (room.images || []).map(img => photoUrl(img.url));

        return {
          id: String(p.id),
          nom: p.name,
          lieu: cityInfo.label,
          type: cityInfo.type,
          img: photoUrl(p.image_url),
          minPrice: p.min_price ? Math.round(p.min_price) : null,
          maxPeople: room.max_people || null,
          bedrooms: room.bedrooms || null,
          bathrooms: room.bathrooms || null,
          desc,
          amenities: mapAmenities(room),
          photos: photos.length > 0 ? photos : [photoUrl(p.image_url)],
        };
      })
      // Tri : Carbet → Saint-Pierre → Morne-Rouge
      .sort((a, b) => {
        const order = { carbet: 0, stpierre: 1, morne: 2 };
        return (order[a.type] ?? 99) - (order[b.type] ?? 99) || a.nom.localeCompare(b.nom);
      });

    const result = {
      updated_at: new Date().toISOString(),
      count: bungalows.length,
      bungalows,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache 1h
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
