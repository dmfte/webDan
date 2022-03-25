const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

class Angle {
	constructor(degrees) {
		this.rad = degrees * Math.PI / 180;
	}
	sin() {
		return Math.sin(this.rad);
	}
	cos() {
		return Math.cos(this.rad);
	}
}

class AngleDynamic {
	constructor() {}
	rad(deg) {
		return deg * Math.PI / 180;
	}
	sin(deg) {
		return Math.sin(deg * Math.PI / 180);
	}
	cos(deg) {
		return Math.cos(deg * Math.PI / 180);
	}
}

resizeCanvas(canvas);
window.addEventListener("resize", function () {
	resizeCanvas(canvas);
});

var w = document.body.scrollWidth;
var h = document.body.scrollHeight;
var maxSize = (w < h) ? w : h;
var sunR = maxSize / 10;
var rayA = sunR * randBetween(2.1, 2.5);
var moveTo = rayA;
var rayALim = [sunR * 2.1, sunR * 2.5];
var rayAVel = randBetween(-0.7, 0.7);
var rayB = sunR * randBetween(1.47, 1.75);
var rayBLim = [sunR * 1.47, sunR * 1.75];
var rayBVel = randBetween(-0.7, 0.7);
var rayCa = sunR * randBetween(0.63, 0.75);
var rayCa = sunR * 0.63;
var rayCaLim = [sunR * 0.63, sunR * 0.75];
var rayCaVel = randBetween(-0.7, 0.7);
var rayCb = sunR * randBetween(0.735, 0.875);
var rayCb = sunR * 0.735;
var rayCbLim = [sunR * 0.735, sunR * 0.875];
var rayCbVel = randBetween(-0.7, 0.7);
var earthOrbit = sunR * 3;
var earthRadius = sunR * 0.3;
var moonOrbit = earthRadius * 1.8;
var moonRadius = earthRadius * 0.3;
var rands = caclSunRays(rayA, rayB, rayCa, rayCb, rayALim, rayBLim, rayCaLim, rayCbLim);
var angle = new AngleDynamic();

var grad = c.createLinearGradient(0, 0, w, h);
grad.addColorStop(0.25, 'rgba(4, 0, 58, 1)');
grad.addColorStop(0.5, 'rgba(16, 109, 121, 1');
grad.addColorStop(0.85, 'rgba(4, 0, 58, 1)');

var randStars = calcStars(maxSize);

var img = new Image();
img.src = "earth.png";


window.requestAnimationFrame(draw);

function draw() {
	let date = new Date();
	let secs = date.getSeconds() + date.getMilliseconds() / 1000;
	let mins = date.getMinutes() + secs / 60;
	let hrs = date.getHours() + mins / 60;
	let cW = c.canvas.getAttribute("width");
	let cH = c.canvas.getAttribute("height");
	c.clearRect(0, 0, cW, cH);
	//  Space.
	c.save();
	c.fillStyle = grad;
	c.fillRect(0, 0, cW, cH);
	c.fill();
	c.restore();
	//  Stars.
	c.save();
	c.fillStyle = "white";
	randStars.forEach(star => {
		if ((star.r < star.lim[0] && star.vel < 0) || (star.r > star.lim[1] && star.vel > 0)) {
			star.vel *= -1;
			star.r += star.vel;
		} else {
			star.r += star.vel;
		}
		c.beginPath();
		c.arc(star.x, star.y, star.r, 0, 2 * Math.PI, false);
		c.fill();
	});
	c.restore();
	// Suns's rays.
	c.save();
	c.translate(cW / 2, cH / 2);
	c.beginPath();
	c.lineWidth = 2;
	c.fillStyle = "orange";
	c.moveTo(0, -moveTo);
	if (rayCa < rayCaLim[1] && rayCa > rayCaLim[0]) {
		rayCa += rayCaVel;
	} else {
		rayCaVel *= -1;
		rayCa += rayCaVel;
	}
	if (rayCb < rayCbLim[1] && rayCb > rayCbLim[0]) {
		rayCb += rayCbVel;
	} else {
		rayCbVel *= -1;
		rayCb += rayCbVel;
	}
	if (rayB < rayBLim[1] && rayB > rayBLim[0]) {
		rayB += rayBVel;
	} else {
		rayBVel *= -1;
		rayB += rayBVel;
	}
	if (rayA < rayALim[1] && rayA > rayALim[0]) {
		rayA += rayAVel;
	} else {
		rayAVel *= -1;
		rayA += rayAVel;
	}
	rands.forEach((rand, i) => {
		if ((rand.rayCurv < rand.limC[0] && rand.vel < 0) || (rand.rayCurv > rand.limC[1] && rand.vel > 0)) {
			rand.vel *= -1;
			rand.rayCurv += rand.vel;
		} else {
			rand.rayCurv += rand.vel;
		}
		if ((rand.ray < rand.lim[0] && rand.vel < 0) || (rand.ray > rand.lim[1] && rand.vel > 0)) {
			rand.vel *= -1;
			rand.ray += rand.vel;
		} else {
			rand.ray += rand.vel;
		}
		c.quadraticCurveTo(vect(rand.rayCurv, rand.angle).x, vect(-rand.rayCurv, rand.angle).y, vect(rand.ray, 30 + (i * 30)).x, vect(-rand.ray, 30 + (i * 30)).y);
	});
	c.fill();
	c.restore();
	//  Sun's rays as seconds hand.
	c.save();
	c.translate(cW / 2, cH / 2);
	c.beginPath();
	c.lineWidth = 1;
	c.fillStyle = "rgba(255, 110, 0, 1)";
	c.rotate(angle.rad(6 * secs));
	let secHandR = sunR * 1.9;
	let secsR1 = sunR * 0.8;
	let secsR2 = sunR * 1.3;
	c.moveTo(0, -secHandR);
	for (let i = 1; i <= 60; i++) {
		if (i == 60) {
			c.quadraticCurveTo(vect(secsR1, 6 * i).x, vect(-secsR1, 6 * i).y, 0, -secHandR);
		} else {
			c.quadraticCurveTo(vect(secsR1, 6 * i).x, vect(-secsR1, 6 * i).y, vect(secsR2, 6 * i).x, vect(-secsR2, 6 * i).y);
		}
	}
	c.fill();
	c.restore();
	// Sun's circumference.
	c.save();
	c.translate(cW / 2, cH / 2);
	c.beginPath();
	c.lineWidth = 1;
	c.fillStyle = "yellow";
	c.arc(0, 0, sunR, 0, 2 * Math.PI, false);
	c.fill();
	c.restore();
	//  Earth (hours).
	c.save();
	c.translate(cW / 2, cH / 2);
	c.rotate(angle.rad(30 * hrs));
	c.translate(0, -earthOrbit);
	c.beginPath();
	c.arc(0, 0, earthRadius, 0, 2 * Math.PI);
	c.fillStyle = "cyan";
	c.fill();
	c.restore();
	//  Moon (minutes).
	c.save();
	c.translate(cW / 2, cH / 2);
	c.rotate(angle.rad(30 * hrs));
	c.translate(0, -earthOrbit);
	c.rotate(-angle.rad(30 * hrs));
	c.rotate(angle.rad(6 * mins));
	c.translate(0, -moonOrbit);
	c.beginPath();
	c.arc(0, 0, moonRadius, 0, 2 * Math.PI, false);
	c.fillStyle = "gray";
	c.fill();
	c.restore();
	//  ---
	requestAnimationFrame(draw);
}

function vect(vectDist, angleDeg) {
	let x = vectDist * Math.sin(angleDeg * Math.PI / 180);
	let y = vectDist * Math.cos(angleDeg * Math.PI / 180);
	return {
		x,
		y
	}
}

function resizeCanvas(canvas) {
	w = document.body.scrollWidth;
	h = document.body.scrollHeight;
	canvas.setAttribute("width", w);
	canvas.setAttribute("height", h);
	grad = c.createLinearGradient(0, 0, w, h);
	grad.addColorStop(0.25, 'rgba(4, 0, 58, 1)');
	grad.addColorStop(0.5, 'rgba(16, 109, 121, 1');
	grad.addColorStop(0.85, 'rgba(4, 0, 58, 1)');

	maxSize = (w < h) ? w : h;
	sunR = maxSize / 10;
	rayA = sunR * randBetween(2.1, 2.5);
	moveTo = rayA;
	rayALim = [sunR * 2.1, sunR * 2.5];
	rayB = sunR * randBetween(1.47, 1.75);
	rayBLim = [sunR * 1.47, sunR * 1.75];
	rayCa = sunR * randBetween(0.63, 0.75);
	rayCa = sunR * 0.63;
	rayCaLim = [sunR * 0.63, sunR * 0.75];
	rayCb = sunR * randBetween(0.735, 0.875);
	rayCb = sunR * 0.735;
	rayCbLim = [sunR * 0.735, sunR * 0.875];
	earthOrbit = sunR * 3;
	earthRadius = sunR * 0.3;
	moonOrbit = earthRadius * 1.8;
	moonRadius = earthRadius * 0.3;

	rands = caclSunRays(rayA, rayB, rayCa, rayCb, rayALim, rayBLim, rayCaLim, rayCbLim);
	randStars = calcStars(maxSize);
}

function calcStars(maxSize) {
	let randStars = [];
	for (let i = 0; i < (maxSize / 10); i++) {
		randStars.push({
			x: randBetween(10, w - 10),
			y: randBetween(10, h - 10),
			r: 1,
			lim: [1, 2],
			vel: randBetween(-0.09, 0.09)
		});
	}
	return randStars;
}

function caclSunRays(rayA, rayB, rayCa, rayCb, rayALim, rayBLim, rayCaLim, rayCbLim) {
	let rands = [];
	for (let i = 0; i < 12; i++) {
		if (i == 11) {
			rayA = moveTo;
		}
		if ((i + 3) % 3 == 0) {
			rands.push({
				rayCurv: rayCa,
				angle: 5 + (30 * i),
				ray: rayB,
				vel: randBetween(-0.7, 0.7),
				limC: rayCaLim,
				lim: rayBLim
			});
		} else {
			if ((i + 2) % 3 == 0) {
				rands.push({
					rayCurv: rayCb,
					angle: 45 + (30 * (i - 1)),
					ray: rayB,
					vel: randBetween(-0.7, 0.7),
					limC: rayCbLim,
					lim: rayBLim
				});
			} else {
				if ((i + 1) % 3 == 0) {
					rands.push({
						rayCurv: rayCa,
						angle: 85 + (30 * (i - 2)),
						ray: rayA,
						vel: randBetween(-0.7, 0.7),
						limC: rayCaLim,
						lim: rayALim
					});
				}
			}
		}
	}
	return rands;
}

function randBetween(num1, num2) {
	//  The returned number will have the same amount of decimals as the given number with the lowest amount of decimals of both numbers.
	let n1 = (num1 < num2 ? num1 : num2);
	let n2 = (num2 < num1 ? num1 : num2);
	let order1 = 0;
	if (n1.toString().search(/\./) !== -1) {
		order1 = n1.toString().split(".")[1].length;
	} else {
		order1 = 0;
	}
	let order2 = 0;
	if (n2.toString().search(/\./) !== -1) {
		order2 = n2.toString().split(".")[1].length;
	} else {
		order2 = 0;
	}
	let order = order1 < order2 ? order1 : order2;
	let rand = n1 + (n2 - n1) * Math.random();
	let decimals = "1";
	for (let i = 0; i < order; i++) {
		decimals = decimals + "0";
	}
	return (Math.round(rand * parseInt(decimals)) / parseInt(decimals));
}