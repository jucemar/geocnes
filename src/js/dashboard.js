export class DataDashboard {

    constructor(estabelecimentos) {
        this._municipio = estabelecimentos[0].MUNICIPIO
        this._totalEstabelecimentos = estabelecimentos.length
        this._totalEstabelecimentosComGeo = estabelecimentos.reduce((count, estabelecimento) => {
            if (estabelecimento.LATITUDE) {
                return count + 1
            }
            return count
        }, 0)

        this._totalEstabelecimentosSemGeo = this.totalEstabelecimentos - this.totalEstabelecimentosComGeo


        this._totalEstabelecimentosGeoDuvidosas = new Set()
        estabelecimentos.filter((value, index) => {
            for (let i = 0; i < estabelecimentos.length; i++) {
                let b = value.LATITUDE === estabelecimentos[i].LATITUDE && value.LONGITUDE === estabelecimentos[i].LONGITUDE && estabelecimentos[i].LONGITUDE && estabelecimentos[i].LATITUDE && value.LONGITUDE && value.LATITUDE
                if (index !== i && b) {
                    this._totalEstabelecimentosGeoDuvidosas.add(estabelecimentos[i].CNES)
                }
            }
        })

    }

    get totalEstabelecimentos() {
        return this._totalEstabelecimentos
    }
    set totalEstabelecimentos(total) {
        this._totalEstabelecimentos = total
    }

    get totalEstabelecimentosComGeo() {
        return this._totalEstabelecimentosComGeo
    }
    set totalEstabelecimentosComGeo(total) {
        this._totalEstabelecimentosComGeo = total
    }

    get totalEstabelecimentosSemGeo() {
        return this._totalEstabelecimentosSemGeo
    }
    set totalEstabelecimentosSemGeo(total) {
        this._totalEstabelecimentosSemGeo = total
    }
    get totalEstabelecimentosGeoDuvidosas() {
        return this._totalEstabelecimentosGeoDuvidosas
    }
    set totalEstabelecimentosGeoDuvidosas(total) {
        this._totalEstabelecimentosGeoDuvidosas = total
    }

    set municipio(municipio) {
        this._municipio = municipio
    }

    get municipio() {
        return this._municipio
    }

}