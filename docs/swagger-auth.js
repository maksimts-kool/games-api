// Kui kasutaja logib Swagger UI-s sisse või välja (Authorize / Logout), laeme
// dokumentatsiooni uuesti, et näha ainult neid päringuid, mida tema roll tohib teha
const swaggerInit = window.onload
window.onload = function () {
    swaggerInit()
    const ui = window.ui
    let lastHeader = ''
    ui.getStore().subscribe(() => {
        const auth = ui.authSelectors.authorized().getIn(['basicAuth', 'value'])
        const header = auth ? 'Basic ' + btoa(auth.get('username') + ':' + auth.get('password')) : ''
        if (header === lastHeader) {
            return
        }
        lastHeader = header
        fetch('./swagger.json', { headers: header ? { Authorization: header } : {} })
            .then(res => res.text())
            .then(spec => {
                // Kui vahepeal logiti uuesti sisse või välja, jätame vana vastuse kasutamata
                if (header === lastHeader) {
                    ui.specActions.updateSpec(spec)
                }
            })
    })
}
