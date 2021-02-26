const w3color = require('./w3color.node.js');
// https://www.w3schools.com/colors/colors_ncs.asp
// https://www.w3schools.com/colors/colors_converter.asp?color=ncs(2030-B30G)
// https://www.w3schools.com/lib/w3color.js

const ncsColor = require('./ncscolor.js');
// https://github.com/m90/ncs-color



function ncsOfDegrees(d) {
  // d: 0 == 400
  if (d <=  10) return 'R';                  // red
  if (d <=  90) return 'R' + (     d) + 'B'; // red-blue
  if (d <= 110) return 'B';                  // blue
  if (d <= 190) return 'B' + (-100+d) + 'G'; // blue-green
  if (d <= 210) return 'G';                  // green
  if (d <= 290) return 'G' + (-200+d) + 'Y'; // green-yellow
  if (d <= 310) return 'Y';                  // yellow
  if (d <= 390) return 'Y' + (-300+d) + 'R'; // yellow-red
  if (d <= 400) return 'R';                  // red
  return ''; // bad input
}

for (let colorDegrees = 0; colorDegrees <= 400; colorDegrees++) {
  const ncs = '0580-' + ncsOfDegrees(colorDegrees);

	const col = w3color(`ncs(${ncs})`);
	if (col.valid == false) {
		console.log(`invalid color: ${ncs}`)
	}
	else {
		/*
		const {
			red, green, blue, // of 255
			hue, // of 360 ?
			sat, lightness, // of 1.0
			whiteness, blackness, // of 1.0
		} = col;
		*/
	}

	const rgb2 = ncsColor.rgb('NCS '+ncs);
	const [_, r, g, b] = rgb2.match(/rgb\((\d+),(\d+),(\d+)\)/).map(s => parseInt(s));
	const col2 = { r, g, b };

	if (col.red != col2.r || col.green != col2.g || col.blue != col2.b) {
		console.log(`mismatch for NCS ${ncs}: w3color rgb(${col.red},${col.green},${col.blue}) vs ${rgb2} ncsColor`)
	}
}
