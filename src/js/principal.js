import { GoogleMapsApi } from './google-maps-api'
import { DataDashboard } from './dashboard'
const MarkerClusterer = require('node-js-marker-clusterer')
import '../assets/css/reset.css'
import '../assets/css/estilo.css'
import * as Papa from 'papaparse'
import { Chart } from 'chart.js'
import { LatLonUfs } from './lat-lon-ufs'


let mapa, divHtml, googleMapsApi, comboUf, comboMunicipio, infoWindow,
  markers, markerClusterer, btnFiltrar, btnReset, estabelecimentos, initLatLng,
  mapEstabMarker, animatedMarker, trClicked, loadMap, inputFile,
  dataDashboard, canvas01Ctx, canvas02Ctx, chart01, chart02, fieldLoadedFileZip, fieldLoadedFileCsv, file, table

chart01 = null
chart02 = null
file = null
comboMunicipio = document.getElementById('comboMunicipio')
$('.files').hide()

comboUf = document.getElementById('comboUf')
btnFiltrar = document.getElementById('btn-filtrar')
btnReset = document.getElementById('btn-reset')
inputFile = document.getElementById('inputFile')

fieldLoadedFileCsv = document.getElementById('loadedFileCsv')
fieldLoadedFileZip = document.getElementById('loadedFileZip')
table = document.getElementById('tabela')
canvas01Ctx = null
canvas02Ctx = null
initLatLng = { lat: -10.3333333, lng: -53.2 }
loadMap = 'loadMap'
infoWindow = null
markers = null
markerClusterer = null
estabelecimentos = [{}]
mapa = null
mapEstabMarker = null
animatedMarker = null
trClicked = null
dataDashboard = null
divHtml = document.getElementById('mapa')
divHtml.classList.add(loadMap)



GoogleMapsApi.config()
  .then(api => {
    googleMapsApi = api
    return api
  })
  .then((api) => {
    criarMapa(api)
    divHtml.style.hidden = true
    iniciaFormulario()
  })

function criarMapa(api) {
  mapa = new api.Map(divHtml, {
    center: initLatLng,
    zoom: 4
  })
}

function iniciaFormulario() {
  comboUf.addEventListener('change', carregarMunicipios)
  comboMunicipio.addEventListener('change', centralizarCidadeMapa)
  inputFile.addEventListener('change', carregarArquivo, false)

  btnFiltrar.addEventListener('click', validarCombos)
  $('#btn-reset').on('click', limpar)
  $('#btn-limpar').on('click', limparTudo)
}

function limparTudo(){
  limpar()
  limparElementoCombo(comboUf)
  $('#loadedFileCsv').removeClass('file-success file-error')
  $('#loadedFileCsv').text('Nenhum')
  $('#loadedFileZip').removeClass('file-success file-error')
  $('#loadedFileZip').text('Nenhum')
  estabelecimentos=null
  $('#comboMunicipio').val('Selecione')
  $('#comboUf').val('Selecione')
  comboUf.removeEventListener('change', carregarMunicipios)
  comboMunicipio.removeEventListener('change', centralizarCidadeMapa)
  inputFile.removeEventListener('change', carregarArquivo)
  btnFiltrar.removeEventListener('click', validarCombos)
  $('#inputFile').val('')
  iniciaFormulario()
  $('#home').show()
  $('#filtros').hide()
  $('#filtros').hide()
  $('.files').hide()
  $('#btn-limpar').hide()
}

function validarCombos() {
  if ($('#comboUf').val() === 'Selecione') {
    $('#comboUf').addClass('btn-empty')
    $('#comboMunicipio').addClass('btn-empty')
  } else if ($('#comboMunicipio').val() === 'Selecione') {
    $('#comboUf').removeClass('btn-empty')
    $('#comboMunicipio').addClass('btn-empty')
  } else {
    $('#comboUf').removeClass('btn-empty')
    $('#comboMunicipio').removeClass('btn-empty')
    carregaEstabelecimentos()
  }
}

function carregarArquivo() {
  file = this.files[0]
  if (this.files.length > 0) {
    $('#btn-limpar').show()
    $('#loadedFileCsv').removeClass('file-success file-error')
    $('#loadedFileCsv').text('Nenhum')
    $('#loadedFileZip').removeClass('file-success file-error')
    $('#loadedFileZip').text('Nenhum')
    $('#arquivos').addClass('load-field')
    lerArquivo(file)
  }
}

function lerArquivo(selectedFile) {
  zip.useWebWorkers=false
  zip.createReader(new zip.BlobReader(selectedFile), reader => {
    reader.getEntries(entries => {
      let filename = entries[0].filename
      if (entries.length) {
        entries[0].getData(new zip.BlobWriter(), unZipedFile => {
          let file = new File(new Array(unZipedFile), filename)
          $('#loadedFileZip').text(selectedFile.name)
          $('#loadedFileZip').addClass('file-success')
          convertToJSON(file);
          reader.close();
        }, (current, total) => {
         /*  console.log('max', total)
          console.log('value', current) */
        })
      }
    })
  }, error => {
    $('#loadedFileZip').text('O arquivo selecionado não é válido!')
    $('#loadedFileZip').addClass('file-error')
  })
}

function convertToJSON(zip) {
  Papa.parse(zip, {
    header: true,
    dynamicTyping: true,
    complete: function (results, file) {
      if (!results.data[0]) {
        mostrarErroNoArquivo()
      } else if (results.data[0].IBGE) {
        $('#filtros').show()
        $('#home').hide()
        $('#arquivos').css('margin-top', '0')
        $('.files').show()
        estabelecimentos = results.data
        $('#loadedFileCsv').text(zip.name)
        $('#loadedFileCsv').addClass('file-success')
        carregarEstados()
      } else {
        mostrarErroNoArquivo()
      }
    },
    trimHeaders: true,
    transformHeader: function (header) {
      return header.replace(' ', '_')
    }
  })
}

function mostrarErroNoArquivo() {
  $('#loadedFileCsv').text('O arquivo descompactado não é válido!')
  $('#loadedFileCsv').addClass('file-error')
  $('#arquivos').removeClass('load-field')
}


function carregarEstados() {
  limparElementoCombo(comboUf)
  $('#arquivos').removeClass('load-field')
  let ufs = estabelecimentos.map((e) => e.UF)
    .filter((value, index, array) => {
      if (array.indexOf(value) === index && value) {
        return true
      } else {
        return false
      }
    })
  for (let uf of ufs) {
    let optionTag = document.createElement('option')
    optionTag.setAttribute('value', uf)
    optionTag.innerHTML = uf
    comboUf.appendChild(optionTag)
  }
  
}

function ordenarEmOrdemAlfabetica(array) {
  return array.sort((a, b) => {
    if (a.nome > b.nome) return 1
    if (a.nome < b.nome) return -1
    return 0
  })
}

function carregarMunicipios(event) {
  if ($('#comboUf').val() !== 'Selecione') {
    $('#comboUf').removeClass('btn-empty')
  }
  
  limparElementoCombo(comboMunicipio)
  let uf = event.target.value
  if (uf === 'Selecione') {
    resetMapa()
  } else {
    centralizaUfMapa(uf)
    let municipios = estabelecimentos
      .filter(value => value.UF === uf)
      .map(e => {
        return { nome: e.MUNICIPIO, codigo: e.IBGE }
      })
      .filter((value, index, array) => {
        let i = array.findIndex((current => current.codigo === value.codigo))
        if (i === index) { return true }
        else { return false }
      })
    for (let municipio of ordenarEmOrdemAlfabetica(municipios)) {
      let optionTag = document.createElement('option')
      optionTag.setAttribute('value', municipio.codigo)
      optionTag.innerHTML = municipio.nome
      comboMunicipio.appendChild(optionTag)
    }

  }
  
}

function centralizaUfMapa(uf) {
  if (uf && uf.length > 0) {
    let geoUf = LatLonUfs.get(uf)
    mapa.panTo({ lat: geoUf.lat, lng: geoUf.lon })
    mapa.setZoom(7)
  } else {
    mapa.panTo(initLatLng)
    mapa.setZoom(7)
  }
}

function centralizarCidadeMapa() {
  if ($('#comboMunicipio').val() !== 'Selecione') {
    $('#comboMunicipio').removeClass('btn-empty')
  }
  let ibge = comboMunicipio.value
  fetch('https:jucemar.github.io/geocnes/lat-lon-munic.json').then(response => response.json()).then(json => {
    return json.find(value => {
      let s = new String(value.codigo_ibge)
      if (s.startsWith(ibge)) {
        return true
      } else {
        return false
      }
    })
  }).then(mun => {
    if (mun) {
      mapa.panTo({ lat: mun.lat, lng: mun.lon })
      mapa.setZoom(10)
    } else {
      centralizaUfMapa($('#comboUf').val())
    }
  })


}


function limparElementoCombo(el) {
  if (el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild)
    }
    let optionTag = document.createElement('option')
    optionTag.setAttribute('value', 'Selecione')
    optionTag.textContent = 'Selecione'
    el.appendChild(optionTag)
  }
}

function limparElementoTable(el) {
  if (el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild)
    }
  }
}

function carregaEstabelecimentos() {
  
  let ibgeSelecionado = new String(comboMunicipio.value)
  let municipio = ibgeSelecionado.substring(0, 7)

  buscarEstabelecimentos(municipio)

}

function resetMapa() {
  mapa.panTo(initLatLng)
  mapa.setZoom(4)
}

function buscarEstabelecimentos(municipio) {


  let estabelecimentosFiltrados = estabelecimentos.filter(value => value.IBGE == municipio)
  estabelecimentosFiltrados.sort((a, b) => {
    if (a.NOME_FANTASIA > b.NOME_FANTASIA) return 1
    if (a.NOME_FANTASIA < b.NOME_FANTASIA) return -1
    return 0
  })

  canvas01Ctx = document.getElementById('grafico1').getContext('2d')
  canvas02Ctx = document.getElementById('grafico2').getContext('2d')
  dataDashboard = new DataDashboard(estabelecimentosFiltrados)
  criarMarkers(estabelecimentosFiltrados)
  exibirEstabelecimentos(estabelecimentosFiltrados)
  mostrarGraficos(estabelecimentosFiltrados)
  

}

function limparGraficos() {
  if (chart01 && chart02) {
    chart01.destroy()
    chart02.destroy()
  }
}

function mostrarGraficos(estabelecimentos) {
  $('#dashboard').show()
  limparGraficos()
  $('#blue').text(dataDashboard.totalEstabelecimentos)
  $('#red').text(`${(dataDashboard.totalEstabelecimentosSemGeo / dataDashboard.totalEstabelecimentos * 100).toFixed(2)}%`)
  $('#green').text(`${(dataDashboard.totalEstabelecimentosComGeo / dataDashboard.totalEstabelecimentos * 100).toFixed(2)}%`)
  $('#yellow').text(`${(dataDashboard.totalEstabelecimentosGeoDuvidosas.size / dataDashboard.totalEstabelecimentosComGeo * 100).toFixed(2)}%`)
  $('#municipio').text(dataDashboard.municipio)



  chart01 = new Chart(canvas01Ctx, {
    type: 'pie',
    data: {
      labels: [' SEM GEO', ' TOTAL'],
      datasets: [{
        data: [dataDashboard.totalEstabelecimentosSemGeo, dataDashboard.totalEstabelecimentos],
        backgroundColor: [
          'rgba(226, 21, 21, 1)',
          'rgba(27, 95, 192, 1)'
        ]
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: true,
      legend: {
        display: true,
        position: 'right'
      }
    }
  })

  chart02 = new Chart(canvas02Ctx, {
    type: 'pie',
    data: {
      labels: [' COM GEO', `GEO REP`],
      datasets: [{
        data: [dataDashboard.totalEstabelecimentosComGeo, dataDashboard.totalEstabelecimentosGeoDuvidosas.size],
        backgroundColor: [
          'rgba(8, 140, 30, 1)',
          'rgba(255, 157, 0, 1)'
        ]
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: true,
      legend: {
        display: true,
        position: 'right'
      }
    }
  })


}

function exibirEstabelecimentos(estabelecimentosFiltrados) {
  $('#resultados').show()
  let areaResultados = document.getElementById('resultados')
  let resultadoVazio = document.getElementById('resultadoVazio')
  if (resultadoVazio) areaResultados.removeChild(document.getElementById('resultadoVazio'))

  limparElementoTable(table)
  let tr = document.createElement('tr')
  let th0 = document.createElement('th')
  let th1 = document.createElement('th')
  let th2 = document.createElement('th')
  let th3 = document.createElement('th')
  let th4 = document.createElement('th')
  let th5 = document.createElement('th')
  th0.textContent = 'ID'
  th1.textContent = 'CNES'
  th2.textContent = 'Nome fantasia'
  th3.textContent = 'Latitude'
  th4.textContent = 'Longitude'
  th5.textContent = 'Status'
  th5.classList.add('td-center')
  tr.appendChild(th0)
  tr.appendChild(th1)
  tr.appendChild(th2)
  tr.appendChild(th3)
  tr.appendChild(th4)
  tr.appendChild(th5)
  tr.classList.add('table-head')
  table.appendChild(tr)

  let indice = 1
  for (let estabelecimento of ordenarEmOrdemAlfabetica(estabelecimentosFiltrados)) {
    let tempMarker = mapEstabMarker.get(estabelecimento.CNES)
    let tr = document.createElement('tr')
    tr.classList.add('tr-estabelecimento')
    let td0 = document.createElement('td')
    td0.textContent = indice++
    let td1 = document.createElement('td')
    td1.textContent = estabelecimento.CNES
    let td2 = document.createElement('td')
    td2.textContent = estabelecimento.NOME_FANTASIA
    td2.setAttribute('style', 'text-align: left')
    let td3 = document.createElement('td')
    td3.textContent = estabelecimento.LATITUDE
    let td4 = document.createElement('td')
    td4.textContent = estabelecimento.LONGITUDE
    let td5 = document.createElement('td')
    let icone = document.createElement('i')
    let clss = () => {
      if (estabelecimento.LATITUDE) {
        if (dataDashboard.totalEstabelecimentosGeoDuvidosas.has(estabelecimento.CNES)) {
          return 'color: rgba(255, 230, 0, 1); font-size:16px'
        } else {
          return 'color: rgba(8, 140, 30, 1); font-size:16px'
        }
      } else {
        return 'color: rgba(226, 21, 21, 1); font-size:16px'
      }
    }
    icone.setAttribute('class', 'material-icons')
    icone.setAttribute('style', clss())
    icone.textContent = 'my_location'
    td5.appendChild(icone)
    td5.classList.add('td-center')
    tr.appendChild(td0)
    tr.appendChild(td1)
    tr.appendChild(td2)
    tr.appendChild(td3)
    tr.appendChild(td4)
    tr.appendChild(td5)
    table.appendChild(tr)
    if (!estabelecimento.LATITUDE) {
      tr.classList.add('tr-no-geo')
    } else {
      tr.addEventListener('click', () => {
        if (estabelecimento.LATITUDE) {
          if (animatedMarker && mapEstabMarker.get(animatedMarker)) {
            mapEstabMarker.get(animatedMarker).setAnimation(null)
            animatedMarker = null
          }
          tempMarker.setAnimation(googleMapsApi.Animation.BOUNCE)
          animatedMarker = estabelecimento.CNES
          mapa.setZoom(21)
          mapa.panTo({ lat: Number(estabelecimento.LATITUDE), lng: Number(estabelecimento.LONGITUDE) })
        }
        tr.classList.add('tr-clicked')
        if (trClicked) {
          trClicked.classList.remove('tr-clicked')
        }
        trClicked = tr
      })
    }
  }
}

function criarMarkers(estabelecimentos) {
  //Limpa todas as markers do mapa
  if (markers) {
    markerClusterer.clearMarkers()
    markers = null
  }
  mapEstabMarker = new Map()
  let estabelecimentosComGeo = estabelecimentos.filter(estabelecimento => estabelecimento.LATITUDE && estabelecimento.LONGITUDE)
  markers = estabelecimentosComGeo.map((location) => {
    let marker = new googleMapsApi.Marker({
      position: new googleMapsApi.LatLng(location.LATITUDE, location.LONGITUDE),
      cursor: 'pointer',
      map: mapa,
      draggable: false,
    })
    addDadosNoEstabelecimento(marker, location)
    mapEstabMarker.set(location.CNES, marker)
    return marker
  })
  let mcOptions = {
    gridSize: 60,
    maxZoom: 15,
    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
  }
  markerClusterer = new MarkerClusterer(mapa, markers, mcOptions)
}

function addDadosNoEstabelecimento(marker, dados) {
  marker.addListener('click', function () {
    if (infoWindow) {
      infoWindow.close()
    }
    infoWindow = new googleMapsApi.InfoWindow()
    infoWindow.setContent(`
          <div class="info-window">
          <p class="info-window title">${dados.RAZAO_SOCIAL}</p>
          <p>${dados.NOME_FANTASIA}</p>
          <p>${dados.LOGRADOURO}, ${dados.NUMERO}</p>    
          <p>${dados.MUNICIPIO} - ${dados.UF}</p>
          <p>${dados.BAIRRO}</p>
          <p>${dados.CEP}</p>
          </div>`)
    infoWindow.open(marker.get('map'), marker);
  })
}

function limpar() {
  limparGraficos()
  $('#comboUf').removeClass('btn-empty')
  $('#comboMunicipio').removeClass('btn-empty')
  $('#dashboard').hide()
  $('#resultados').hide()

  $('comboMunicipio').val(1)
  if (markerClusterer) {
    markerClusterer.clearMarkers()
  }
  resetMapa()
  limparElementoTable(table)
  limparElementoCombo(comboMunicipio)
  $('#comboMunicipio').val('Selecione')
  $('#comboUf').val('Selecione')
}