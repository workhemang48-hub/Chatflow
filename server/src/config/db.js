import mongoose from 'mongoose';
import dns from 'dns';

// Some ISPs/routers/VPNs block the DNS SRV record lookups that
// mongodb+srv:// connection strings rely on. Pointing Node at a public
// resolver directly works around that without changing the connection string.
// Lives here (not index.js) so every entry point that calls connectDB —
// the server AND the seed script — gets the fix automatically.
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/chatflow';

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri);
    console.log(`[db] connected → ${uri}`);
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }
}