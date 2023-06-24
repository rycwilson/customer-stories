export async function getJSON(dataPath) {
  const headers = {
    'Content-Type': 'application/json', 
    'X-CSRF-Token': document.querySelector('[name="csrf-token" ]').content
  };
  try {
    // return await Promise.all([
    //   fetch('/successes', headers).then(res => res.json()), 
    //   fetch('/companies/0/contributions', headers).then(res => res.json())
    // ]);
    return await fetch(dataPath, headers).then(res => res.json());
  } catch(err) {
    console.error(err);
  }
}