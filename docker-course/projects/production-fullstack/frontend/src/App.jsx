import React, { useState, useEffect } from 'react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'DOWN', error: err.message });
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items');
      const json = await res.json();
      setItems(json.data || []);
      setSource(json.source || 'direct');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !price) return;
    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price) })
      });
      setName('');
      setPrice('');
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchItems();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <header className="header">
        <div className="logo-badge">🐳 Docker Mastery Capstone</div>
        <h1>Production Microservices Control Center</h1>
        <p className="subtitle">React SPA ➔ Nginx Proxy ➔ Express API ➔ MongoDB + Redis</p>
      </header>

      <div className="grid">
        <div className="card">
          <h2>Stack Health & Discovery</h2>
          {health ? (
            <div className="health-box">
              <div className="status-row">
                <span>Stack Status:</span>
                <strong className={health.status === 'UP' ? 'badge green' : 'badge red'}>
                  {health.status}
                </strong>
              </div>
              {health.services && (
                <div className="services-grid">
                  <div className="service-item">
                    <span>MongoDB:</span>
                    <span className={health.services.mongodb === 'UP' ? 'tag green' : 'tag red'}>
                      {health.services.mongodb}
                    </span>
                  </div>
                  <div className="service-item">
                    <span>Redis Cache:</span>
                    <span className={health.services.redis === 'UP' ? 'tag green' : 'tag red'}>
                      {health.services.redis}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>Connecting to Docker Engine network...</p>
          )}
        </div>

        <div className="card">
          <h2>Add Persistent Entity</h2>
          <form onSubmit={handleCreate} className="form">
            <input
              type="text"
              placeholder="Item Name (e.g. Docker Swarm Cluster)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Price ($)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Save to MongoDB & Flush Redis</button>
          </form>
        </div>
      </div>

      <div className="card full-width">
        <div className="section-header">
          <h2>Cached Inventory ({items.length})</h2>
          <div className="cache-indicator">
            Source: <strong className={source === 'redis-cache' ? 'highlight-redis' : 'highlight-mongo'}>{source}</strong>
            <button onClick={fetchItems} className="btn-refresh">🔄 Refresh</button>
          </div>
        </div>

        {loading ? (
          <p>Querying upstream API...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item Name</th>
                  <th>Price ($)</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty">No records yet. Add an item above to test persistence.</td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it._id}>
                      <td className="mono">{it._id}</td>
                      <td><strong>{it.name}</strong></td>
                      <td>${it.price}</td>
                      <td className="muted">{new Date(it.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
