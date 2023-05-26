export default {
  panels: {
    prospect: {
      init() {
        console.log('init prospect')
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