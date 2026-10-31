import http from 'http';

http.get('http://localhost:4321/editor/', (res) => {
  let html = '';
  res.on('data', (c) => html += c);
  res.on('end', async () => {
    console.log('HTML length:', html.length);
    const scripts = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
    console.log('Scripts found:', scripts);
    for (const src of scripts) {
      const url = src.startsWith('http') ? src : `http://localhost:4321${src}`;
      await new Promise((resolve) => {
        http.get(url, (sres) => {
          console.log(`Script ${src} -> Status: ${sres.statusCode}, Content-Type: ${sres.headers['content-type']}`);
          let sdata = '';
          sres.on('data', c => sdata += c);
          sres.on('end', () => {
            console.log(`Script ${src} -> Length: ${sdata.length}`);
            resolve();
          });
        }).on('error', (err) => {
          console.log(`Script ${src} error:`, err.message);
          resolve();
        });
      });
    }
  });
});
