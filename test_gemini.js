const q = async () => { 
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY_HERE', {
    method:'POST', 
    headers:{'Content-Type':'application/json'}, 
    body:JSON.stringify({
      contents:[{
        parts:[{text:'Respond with a valid JSON: {"test": 123}'}]
      }]
    })
  }); 
  const j = await r.json(); 
  console.log(JSON.stringify(j, null, 2)); 
}; 
q();
