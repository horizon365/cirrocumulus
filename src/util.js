import {color} from 'd3-color';
import {scaleLinear} from 'd3-scale';
import * as scaleChromatic from 'd3-scale-chromatic';
import simplify from 'simplify-js';
import {getColors} from './ThreeUtil';

export const interpolators = {};
interpolators['Diverging'] = [
    'interpolateBrBG',
    'interpolatePRGn',
    'interpolatePiYG',
    'interpolatePuOr',
    'interpolateRdBu',
    'interpolateRdGy',
    'interpolateRdYlBu',
    'interpolateRdYlGn',
    'interpolateSpectral'];

interpolators['Sequential (Single Hue)'] = [
    'interpolateBlues',
    'interpolateGreens',
    'interpolateGreys',
    'interpolateOranges',
    'interpolatePurples',
    'interpolateReds'];

interpolators['Sequential (Multi-Hue)'] = [
    'interpolateViridis',
    'interpolateInferno',
    'interpolateMagma',
    'interpolatePlasma',
    'interpolateWarm',
    'interpolateCool',
    'interpolateCubehelixDefault',
    'interpolateBuGn',
    'interpolateBuPu',
    'interpolateGnBu',
    'interpolateOrRd',
    'interpolatePuBuGn',
    'interpolatePuBu',
    'interpolatePuRd',
    'interpolateRdPu',
    'interpolateYlGnBu',
    'interpolateYlGn',
    'interpolateYlOrBr',
    'interpolateYlOrRd'];

interpolators['Cyclical'] = ['interpolateRainbow', 'interpolateSinebow'];


// const TWENTY_COLORS = [
//     '#1f77b4', '#aec7e8', '#ff7f0e',
//     '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd',
//     '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f',
//     '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'];

export const CATEGORY_20B = [
    '#393b79', '#5254a3', '#6b6ecf',
    '#9c9ede', '#637939', '#8ca252', '#b5cf6b', '#cedb9c', '#8c6d31',
    '#bd9e39', '#e7ba52', '#e7cb94', '#843c39', '#ad494a', '#d6616b',
    '#e7969c', '#7b4173', '#a55194', '#ce6dbd', '#de9ed6'];
export const CATEGORY_20C = [
    '#3182bd', '#6baed6', '#9ecae1',
    '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354',
    '#74c476', '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8', '#bcbddc',
    '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9'];

export function getChartSize() {
    // leave room for drawer and header
    return {width: window.screen.availWidth - 280, height: window.screen.availHeight - 220};
}

/**
 *
 * @param array. Array of format,data
 */
export function setClipboardData(clipboardData) {
    const container = document.activeElement;
    const isRTL = document.documentElement.getAttribute('dir') == 'rtl';
    const fakeElem = document.createElement('div');
    fakeElem.contentEditable = true;

    // Prevent zooming on iOS
    fakeElem.style.fontSize = '12pt';
    // Reset box model

    fakeElem.style.border = '0';
    fakeElem.style.padding = '0';
    fakeElem.style.margin = '0';
    // Move element out of screen horizontally
    fakeElem.style.position = 'absolute';
    fakeElem.style[isRTL ? 'right' : 'left'] = '-999999px';
    // Move element to the same position vertically
    fakeElem.style.top = (window.pageYOffset || document.documentElement.scrollTop) + 'px';
    fakeElem.setAttribute('readonly', '');
    //fakeElem.innerHTML = html;
    const copyListener = (e) => {

        clipboardData.forEach(function (elem) {
            e.clipboardData.setData(elem.format, elem.data);
        });

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        fakeElem.removeEventListener('copy', copyListener);
    };
    fakeElem.addEventListener('copy', copyListener);

    container.appendChild(fakeElem);

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(fakeElem);
    selection.removeAllRanges();
    selection.addRange(range);
    const fakeHandlerCallback = (event) => {
        container.removeChild(fakeElem);
        container.removeEventListener('click', fakeHandlerCallback);
    };
    document.execCommand('copy');
    container.addEventListener('click', fakeHandlerCallback);
};

export function updateTraceColors(traceInfo) {
    if (traceInfo.isImage) {
        let colors = [];
        let colorScale = traceInfo.colorScale;
        const colorMapper = rgb => rgb.formatHex();
        for (let i = 0, n = traceInfo.npoints; i < n; i++) {
            let rgb = color(colorScale(traceInfo.values[i]));
            colors.push(colorMapper(rgb));
        }
        traceInfo.colors = colors;
    } else {
        traceInfo.colors = getColors(traceInfo);
    }
}

export function isPointInside(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point.x, y = point.y;

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}


export function arrayToSvgPath(lassoPathArray) {
    if (lassoPathArray.length > 1) {
        lassoPathArray = simplify(lassoPathArray);
    }
    let svgPath = 'M ' + lassoPathArray[0].x + ' ' + lassoPathArray[0].y;
    for (let i = 1; i < lassoPathArray.length; i++) {
        svgPath += ' L ' + lassoPathArray[i].x + ' ' + lassoPathArray[i].y;
    }
    svgPath += ' Z';
    return svgPath;
}

export function getRgbScale() {
    return scaleLinear().domain([0, 255]).range([0, 1]);
}

export function fixInterpolatorName(name) {
    if (!name.startsWith("interpolate")) {
        name = "interpolate" + name;
    }
    return name;
}

export function getInterpolator(name) {
    return scaleChromatic[fixInterpolatorName(name)];
}

export function convertPointsToBins(points, allBins) {
    let bins = [];
    for (let i = 0, n = points.length; i < n; i++) {
        bins.push(allBins[points[i]]);
    }
    return bins;
}

export function convertBinsToPoints(bins, selectedBins) {
    let points = [];
    let binIndex = 0;

    for (let i = 0, n = bins.length; i < n; i++) {
        if (bins[i] === selectedBins[binIndex]) {
            points.push(i);
            binIndex++;
        }
    }

    // selectedBins = new Set(selectedBins);
    // for (let i = 0, n = bins.length; i < n; i++) {
    //     if (selectedBins.has(bins[i])) {
    //         points.push(i);
    //     }
    // }

    return points;
}


export function createDotPlotConfig() {
    return {
        showLink: false,
        scrollZoom: false,
        responsive: false,
        displaylogo: false,
        displayModeBar: true,
        modeBarButtonsToRemove: ['hoverCompareCartesian', 'hoverClosestCartesian', 'toggleSpikelines', 'sendDataToCloud', 'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d']
    };
}


export function createDotPlotAxis() {
    return {
        showbackground: false,
        autorange: false,
        fixedrange: true,
        showgrid: true,
        zeroline: false,
        showline: false,
        title: '',
        // type: 'category'
        autotick: false
    };
}

export function createDotPlotLayout(options) {
    let {width, height} = options;
    let layout = {
        hovermode: 'closest',
        dragmode: 'select',
        width: width,
        height: height,
        margin: {
            l: 0,
            b: 0,
            r: 0,
            t: 0,
            autoexpand: false
        },
        fixedrange: true,
        legend: {yanchor: 'top'},
        autosize: true,
        displaylogo: false,
        showlegend: false,
        font: {
            family: 'Roboto Condensed,Helvetica,Arial,sans-serif'
        }
    };

    layout.xaxis = createDotPlotAxis();
    layout.yaxis = createDotPlotAxis();
    return layout;
}

export function splitSearchTokens(tokens) {
    let X = [];
    let obs = [];
    let obsCat = [];
    tokens.forEach(token => {
        if (token.type === 'X') {
            X.push(token.value);
        } else if (token.type === 'obs') {
            obs.push(token.value);
        } else {
            obsCat.push(token.value);
        }
    });
    return {X: X, obs: obs, obsCat: obsCat};
}