const w3colorLib = require('./w3color.node.js');
// https://www.w3schools.com/colors/colors_ncs.asp
// https://www.w3schools.com/colors/colors_converter.asp?color=ncs(2030-B30G)
// https://www.w3schools.com/lib/w3color.js

const ncsColorLib = require('./ncscolor.js');
// https://github.com/m90/ncs-color

function ncsOfDegrees(d) {
  // d: 0 == 400
  if (d <    0) return ''; // bad input
  if (d ==   0) return 'R';                  // red
  if (d <  100) return 'R' + (     d) + 'B'; // red-blue
  if (d == 100) return 'B';                  // blue
  if (d <  200) return 'B' + (-100+d) + 'G'; // blue-green
  if (d == 200) return 'G';                  // green
  if (d <  300) return 'G' + (-200+d) + 'Y'; // green-yellow
  if (d == 300) return 'Y';                  // yellow
  if (d <  400) return 'Y' + (-300+d) + 'R'; // yellow-red
  if (d <= 400) return 'R';                  // red
  return ''; // bad input
}

// ncs format: S ${nuance.s}${nuance.c}-${hue.a}${hue.phi}${hue.b}

const log_invalid = false; // 1 <= hue.phi <= 9: invalid color for some algorithms

const maxval = {
  w3color: {
    col: {
      red: 255, green: 255, blue: 255,
      hue: 360, // of 360
      sat: 1, lightness: 1,
      whiteness: 1, blackness: 1,
    },
  },
  ncsColor: {
    col: {
      r: 255, g: 255, b: 255,
    },
  }
};

// tolerance in percent (inclusive values)
// sample bug with color NCS 0580-G76Y
//   unsteady value: ncsColor.col.r: 253 - 357 = -41%
//   unsteady value: ncsColor.col.g: 255 - 357 = -40%
//   unsteady value: ncsColor.col.b: 36 - 51 = -6%
const tolerance = {
  w3color: {
    col: {
      // TODO minimize
      red: 6, green: 5, blue: 6,
      hue: 7,
      sat: 2, lightness: 12,
      whiteness: 22, blackness: 7,
    },
  },
  ncsColor: {
    col: {
      r: 6, g: 5, b: 5,
    },
  },
};

// scale tolerance with the difference in degrees
//const upscale_tolerance = 0.5; // 0 <= x <= 1
const upscale_tolerance = 1; // 0 <= x <= 1

function fmtRgb(val) {
  function leftPad3(n) { return ("   " + n).slice(-3); }
  if (val.col.r) return `rgb(${leftPad3(val.col.r)},${leftPad3(val.col.g)},${leftPad3(val.col.b)})`;
  if (val.col.red) return `rgb(${leftPad3(val.col.red)},${leftPad3(val.col.green)},${leftPad3(val.col.blue)})`;
  return 'rgb(?,?,?)';
}



let errors_found = false;

let last = {
  w3color: null,
  ncsColor: null,
};

// loop colors
// full circle (0 to 399) + some extra steps, to check continuity around zero
// extra steps are needed, cos some libraries give no result near the four primary colors (+-10%)
for (let colorDegreesFull = 0; colorDegreesFull <= 420; colorDegreesFull++) {
  const colorDegrees = colorDegreesFull % 400;
  const ncs = '0580-' + ncsOfDegrees(colorDegrees);

  let log_added = false;

  const curr = {};
  curr.colorDegrees = colorDegrees;

  curr.w3color = {};
  curr.w3color.colorDegrees = colorDegrees;
  curr.w3color.ncs = ncs;
  curr.w3color.col = w3colorLib(`ncs(${ncs})`);
  if (log_invalid && curr.w3color.col.valid == false) {
    console.log(`w3color: invalid color ${ncs}`)
  }

  curr.ncsColor = {};
  curr.ncsColor.colorDegrees = colorDegrees;
  curr.ncsColor.ncs = ncs;
  curr.ncsColor.rgb = ncsColorLib.rgb('NCS '+ncs);
  let col2 = null;
  if (curr.ncsColor.rgb == null) {
    if (log_invalid) {
      console.log(`ncsColor: no result for NCS ${ncs}. w3color says ${fmtRgb(curr.w3color)}`);
    }
  }
  else {
    const [_, r, g, b] = curr.ncsColor.rgb.match(/rgb\((\d+),(\d+),(\d+)\)/).map(s => parseInt(s));
    curr.ncsColor.col = { r, g, b };

    if (
      curr.ncsColor.col.r != curr.w3color.col.red ||
      curr.ncsColor.col.g != curr.w3color.col.green ||
      curr.ncsColor.col.b != curr.w3color.col.blue
    ) {
      console.log(`mismatch: degree ${curr.colorDegrees} / 400 = ncs ${ncs}:`);
      console.log(`            last             -> curr (mismatch)`);
      console.log(`  w3color:  ${fmtRgb(last.w3color)} -> ${fmtRgb(curr.w3color)}`);
      console.log(`  ncsColor: ${fmtRgb(last.ncsColor)} -> ${fmtRgb(curr.ncsColor)}`);
      console.log(); // separate output blocks
    }
  }

  // test steadiness of values
  Object.keys(tolerance).forEach(key1 => {
    if (last[key1] == null || curr[key1] == null) return;
    if (key1 == 'w3color' && curr[key1].col.valid == false) return;
    const d1 = last[key1].colorDegrees;
    const d2 = curr[key1].colorDegrees;
    let deg_diff = d2 - d1;
    Object.keys(tolerance[key1]).forEach(key2 => {
      if (last[key1][key2] == null || curr[key1][key2] == null) return;
      Object.keys(tolerance[key1][key2]).forEach(key3 => {
        const v1 = last[key1][key2][key3];
        const v2 = curr[key1][key2][key3];
        if (deg_diff < -300 || 300 < deg_diff) {
          deg_diff = deg_diff - Math.sign(deg_diff)*400; // modulo
        }
        const tol_scale = (deg_diff - 1)*(1 + upscale_tolerance) + 1;
        const max = maxval[key1][key2][key3];
        const tol_100 = tolerance[key1][key2][key3];
        let diff = v2 - v1;
        if (key2 == 'col' && key3 == 'hue' && (diff < -300 || 300 < diff)) {
          diff = diff - Math.sign(diff)*360; // modulo
        }
        const diff_100 = Math.round(diff/max * 100);
        const diff_100_abs = Math.abs(diff_100);

        if (diff_100_abs > (tol_100 * tol_scale)) {
          console.log(`unsteady: degree ${d1} -> ${d2} / 400 = ncs ${last[key1].ncs} -> ${curr[key1].ncs}:`);
          console.log(`  last: ${fmtRgb(last[key1])}. ${key1}.${key2}.${key3} = ${v1}`);
          console.log(`  curr: ${fmtRgb(curr[key1])}. ${key1}.${key2}.${key3} = ${v2} = ${(diff_100 > 0 ? `+${diff_100}` : diff_100)}%`);
          log_added = true;
          errors_found = true;
        }
      });
    });
  });

  if (log_added) {
    console.log(); // add newline between degrees
  }

  if (curr.w3color.col.valid == true && curr.ncsColor.rgb != null) {
    last = curr;
  }
  else if (curr.w3color.col.valid == false && curr.ncsColor.rgb != null) {
    // only ncs-color
    last = {
      w3color: last.w3color,
      ncsColor: curr.ncsColor,
    };
  }
  else if (curr.w3color.col.valid == true && curr.ncsColor.rgb == null) {
    // only w3color
    last = {
      w3color: curr.w3color,
      ncsColor: last.ncsColor,
    };
  }
}

if (errors_found) {
  console.log('errors found :(');
}
else {
  console.log('looking good :)');
}
