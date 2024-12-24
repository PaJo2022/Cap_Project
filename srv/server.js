
const cds = require('@sap/cds')
const proxy = require('@sap/cds-odata-v2-adapter-proxy')

cds.on('bootstrap', app => {
    app.use(proxy())
    app.get('/health', (_, res) => {
        res.status(200).send('OK')
    })
})



module.exports = cds.server