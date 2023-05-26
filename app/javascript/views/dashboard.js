const requestHeaders = () => ({ 
  'Content-Type': 'application/json', 
  'X-CSRF-Token': document.querySelector('[name="csrf-token" ]').content
});

export default {
  panels: {
    prospect: {
      init() {
        console.log('init prospect')
        getProspectData().then(([customerWins, contributions]) => {
          Object.assign(CSP.data, { customerWins, contributions })
        })
      },
      addListeners() {
        console.log('prospect listeners')
      }
    },
    curate: {
      init() {
        console.log('init curate')
      },
      addListeners() {
        console.log('curate listeners')
      }
    },
    promote: {
      init() {
        console.log('init promote')
        getPromotedStories().then(promotedStories => {
          Object.assign(CSP.data, { promotedStories })
        })
      },
      addListeners() {
        console.log('promote listeners')
      }
    },
    measure: {
      init() {
        console.log('init measure')
      },
      addListeners() {
        console.log('measure listeners')
      }
    }
  }
}

async function getProspectData() {
  try {
    return await Promise.all([
      fetch('/successes', requestHeaders()).then(res => res.json()), 
      fetch('/companies/0/contributions', requestHeaders()).then(res => res.json())
    ]);
  } catch(err) {
    console.error(err);
  }
}

async function getPromotedStories() {
  const subdomain = location.hostname.slice(0, location.hostname.indexOf('.'));
  try {
    return await fetch(`/companies/${subdomain}/stories/promoted`, requestHeaders()).then(res => res.json());
  } catch (err) {
    console.error(err);
  }
}