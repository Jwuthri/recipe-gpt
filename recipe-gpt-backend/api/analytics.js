import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period = '24h' } = req.query;
    
    let timeFilter = '';
    switch (period) {
      case '1h':
        timeFilter = "timestamp > NOW() - INTERVAL '1 hour'";
        break;
      case '24h':
        timeFilter = "timestamp > NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        timeFilter = "timestamp > NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeFilter = "timestamp > NOW() - INTERVAL '30 days'";
        break;
      default:
        timeFilter = "timestamp > NOW() - INTERVAL '24 hours'";
    }

    // Get basic stats
    const { data: stats } = await supabase
      .from('llm_messages')
      .select('*')
      .gte('timestamp', timeFilter);

    if (!stats) {
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }

    // Calculate analytics
    const totalRequests = stats.length;
    const successfulRequests = stats.filter(s => s.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(2) : 0;
    
    const averageResponseTime = stats.length > 0 
      ? (stats.reduce((sum, s) => sum + (s.response_time_ms || 0), 0) / stats.length).toFixed(0)
      : 0;

    // Most popular styles
    const styleStats = stats.reduce((acc, s) => {
      const style = s.style_id || 'unknown';
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {});

    // Request types
    const typeStats = stats.reduce((acc, s) => {
      const type = s.request_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Recent activity (last 10 requests)
    const recentActivity = stats
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(s => ({
        timestamp: s.timestamp,
        success: s.success,
        style: s.style_id,
        responseTime: s.response_time_ms,
        ingredientsCount: s.ingredients_count
      }));

    const analytics = {
      period,
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: `${successRate}%`,
      averageResponseTime: `${averageResponseTime}ms`,
      popularStyles: Object.entries(styleStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([style, count]) => ({ style, count })),
      requestTypes: typeStats,
      recentActivity
    };

    return res.status(200).json(analytics);

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error.message 
    });
  }
} 