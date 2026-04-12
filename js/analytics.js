const Analytics = (() => {

  let supabase = null;
  let sessionId = null;
  let queue = [];
  let flushing = false;

  function init(supabaseClient) {
    supabase = supabaseClient;
    sessionId = generateSessionId();
    window.addEventListener('beforeunload', flush);
    // Flush queue every 10 seconds
    setInterval(flush, 10000);
  }

  function generateSessionId() {
    try {
      let sid = sessionStorage.getItem('_msid');
      if (!sid) {
        sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem('_msid', sid);
      }
      return sid;
    } catch {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
  }

  function track(event, props) {
    queue.push({
      event,
      props: props || {},
      ts: new Date().toISOString(),
      session_id: sessionId,
      referrer: document.referrer || null,
      ua: navigator.userAgent || null
    });

    if (queue.length >= 5) flush();
  }

  async function flush() {
    if (!supabase || queue.length === 0 || flushing) return;
    flushing = true;

    const batch = queue.splice(0, 20);
    try {
      await supabase.from('analytics_events').insert(batch);
    } catch {
      queue.unshift(...batch);
    }
    flushing = false;
  }

  return { init, track, flush };

})();
