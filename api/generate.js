import fetch from 'node-fetch';
import FormData from 'form-data';

// Rate limit storage (in-memory)
const rateLimitStore = new Map();

// Clean up old entries setiap 1 jam
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 0) {
      rateLimitStore.delete(ip);
    }
  }
}, 3600000);

function getRateLimitInfo(ip) {
  const now = Date.now();
  const data = rateLimitStore.get(ip);
  
  if (!data || now > data.resetTime) {
    // Reset atau buat baru (24 jam dari sekarang)
    const resetTime = now + (24 * 60 * 60 * 1000);
    const newData = {
      count: 0,
      resetTime: resetTime,
      resetDate: new Date(resetTime).toISOString()
    };
    rateLimitStore.set(ip, newData);
    return newData;
  }
  
  return data;
}

function incrementRateLimit(ip) {
  const data = getRateLimitInfo(ip);
  data.count += 1;
  rateLimitStore.set(ip, data);
  return data;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get client IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress || 
             'unknown';

  // Handle GET request untuk cek rate limit
  if (req.method === 'GET') {
    const limitInfo = getRateLimitInfo(ip);
    const remaining = Math.max(0, 100 - limitInfo.count);
    
    return res.status(200).json({
      limit: 100,
      remaining: remaining,
      used: limitInfo.count,
      resetAt: limitInfo.resetDate,
      resetIn: Math.max(0, Math.floor((limitInfo.resetTime - Date.now()) / 1000))
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check rate limit
    const limitInfo = getRateLimitInfo(ip);
    
    if (limitInfo.count >= 100) {
      const resetIn = Math.floor((limitInfo.resetTime - Date.now()) / 1000);
      const hours = Math.floor(resetIn / 3600);
      const minutes = Math.floor((resetIn % 3600) / 60);
      
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: `Limit harian tercapai! Coba lagi dalam ${hours}j ${minutes}m`,
        limit: 100,
        remaining: 0,
        resetAt: limitInfo.resetDate,
        resetIn: resetIn
      });
    }

    // Parse multipart form data
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    // Read chunks from request
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse boundary
    const boundary = contentType.split('boundary=')[1];
    const parts = buffer.toString('binary').split(`--${boundary}`);
    
    let imageBuffer = null;
    let username = null;
    let imageName = 'image.jpg';

    // Extract form fields
    for (const part of parts) {
      if (part.includes('Content-Disposition')) {
        if (part.includes('name="image"')) {
          const filenameMatch = part.match(/filename="(.+?)"/);
          if (filenameMatch) imageName = filenameMatch[1];
          
          const dataStart = part.indexOf('\r\n\r\n') + 4;
          const dataEnd = part.lastIndexOf('\r\n');
          imageBuffer = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
        } else if (part.includes('name="username"')) {
          const dataStart = part.indexOf('\r\n\r\n') + 4;
          const dataEnd = part.lastIndexOf('\r\n');
          username = part.substring(dataStart, dataEnd).trim();
        }
      }
    }

    // Validation
    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(400).json({ error: 'Gambar tidak ditemukan!' });
    }
    if (!username) {
      return res.status(400).json({ error: 'Username tidak boleh kosong!' });
    }

    // Create form data for external API
    const formData = new FormData();
    formData.append('image', imageBuffer, { filename: imageName });
    formData.append('username', username);

    // Call external API
    const response = await fetch('https://api.zenzxz.my.id/api/maker/fakeml', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error('External API error');
    }

    // Increment rate limit setelah sukses
    const updatedLimit = incrementRateLimit(ip);
    const remaining = Math.max(0, 100 - updatedLimit.count);

    // Get image buffer
    const resultBuffer = await response.arrayBuffer();

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', updatedLimit.resetDate);

    // Send response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="FakeML_${username}_${Date.now()}.png"`);
    res.send(Buffer.from(resultBuffer));

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Gagal generate gambar',
      message: error.message || 'Terjadi kesalahan pada server'
    });
  }
}
