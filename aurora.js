(function () {
    var canvas = document.getElementById("aurora-canvas");
    if (!canvas) {
        return;
    }

    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var context = canvas.getContext("2d", { alpha: false });
    var animationFrame = null;
    var renderWidth = 0;
    var renderHeight = 0;

    function SimplexNoise(random) {
        var source = random || Math;
        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];
        this.p = [];
        this.perm = [];

        for (var i = 0; i < 256; i += 1) {
            this.p[i] = Math.floor(source.random() * 256);
        }

        for (var j = 0; j < 512; j += 1) {
            this.perm[j] = this.p[j & 255];
        }
    }

    SimplexNoise.prototype.dot3 = function (gradient, x, y, z) {
        return gradient[0] * x + gradient[1] * y + gradient[2] * z;
    };

    SimplexNoise.prototype.noise3d = function (xin, yin, zin) {
        var n0;
        var n1;
        var n2;
        var n3;
        var f3 = 1 / 3;
        var g3 = 1 / 6;
        var s = (xin + yin + zin) * f3;
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var k = Math.floor(zin + s);
        var t = (i + j + k) * g3;
        var x0 = xin - (i - t);
        var y0 = yin - (j - t);
        var z0 = zin - (k - t);
        var i1;
        var j1;
        var k1;
        var i2;
        var j2;
        var k2;

        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
            } else if (x0 >= z0) {
                i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
            } else {
                i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
            }
        } else if (y0 < z0) {
            i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
        } else if (x0 < z0) {
            i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
        } else {
            i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
        }

        var x1 = x0 - i1 + g3;
        var y1 = y0 - j1 + g3;
        var z1 = z0 - k1 + g3;
        var x2 = x0 - i2 + 2 * g3;
        var y2 = y0 - j2 + 2 * g3;
        var z2 = z0 - k2 + 2 * g3;
        var x3 = x0 - 1 + 3 * g3;
        var y3 = y0 - 1 + 3 * g3;
        var z3 = z0 - 1 + 3 * g3;
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        var gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
        var gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
        var gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
        var gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;

        n0 = t0 < 0 ? 0 : Math.pow(t0, 4) * this.dot3(this.grad3[gi0], x0, y0, z0);
        n1 = t1 < 0 ? 0 : Math.pow(t1, 4) * this.dot3(this.grad3[gi1], x1, y1, z1);
        n2 = t2 < 0 ? 0 : Math.pow(t2, 4) * this.dot3(this.grad3[gi2], x2, y2, z2);
        n3 = t3 < 0 ? 0 : Math.pow(t3, 4) * this.dot3(this.grad3[gi3], x3, y3, z3);

        return 32 * (n0 + n1 + n2 + n3);
    };

    var simplex = new SimplexNoise();

    function clampColor(value) {
        return Math.max(0, Math.min(255, value));
    }

    function resizeCanvas() {
        var bounds = canvas.getBoundingClientRect();
        renderWidth = Math.max(320, Math.min(960, Math.round(bounds.width / 2)));
        renderHeight = Math.max(180, Math.min(480, Math.round(bounds.height / 2)));
        canvas.width = renderWidth;
        canvas.height = renderHeight;
    }

    function drawAurora(timeStamp) {
        var time = timeStamp / 4000;
        var gradient = context.createLinearGradient(0, 0, renderHeight / 0.4, renderHeight * 0.9);
        gradient.addColorStop(0, "rgba(86,59,148,1)");
        gradient.addColorStop((Math.sin(time) + 1) * 0.1, "rgba(178,64,95,.3)");
        gradient.addColorStop((Math.cos(time) + 1) * 0.1 + 0.444, "rgba(0,200,120,.62)");
        gradient.addColorStop(0.7, "rgba(55,60,140,.34)");
        gradient.addColorStop(1, "rgba(0,200,80,.55)");

        context.fillStyle = gradient;
        context.fillRect(0, 0, renderWidth, renderHeight);

        var base = context.getImageData(0, 0, renderWidth, renderHeight);
        var output = context.createImageData(renderWidth, renderHeight);
        var input = base.data;
        var data = output.data;
        var scaleX = 13.333;
        var scaleY = 0.833;

        for (var i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
            var y = Math.floor(pixel / renderWidth);
            var x = pixel % renderWidth;
            var noise = simplex.noise3d((x / renderWidth) * 0.6 * scaleX, (y / renderHeight) * 0.6 * scaleY, time);
            var veil = Math.pow(Math.max(0, 1 - y / renderHeight), 0.8);
            var factor = (noise * 0.5 + 0.5) * (0.45 + veil * 0.75);

            data[i] = clampColor(factor * input[i] + 5);
            data[i + 1] = clampColor(factor * input[i + 1] + 8);
            data[i + 2] = clampColor(factor * input[i + 2] + 18);
            data[i + 3] = 255;
        }

        context.putImageData(output, 0, 0);

        var fade = context.createLinearGradient(0, 0, 0, renderHeight);
        fade.addColorStop(0, "rgba(0,0,0,0)");
        fade.addColorStop(0.62, "rgba(0,0,0,.15)");
        fade.addColorStop(1, "rgba(0,0,0,.98)");
        context.fillStyle = fade;
        context.fillRect(0, 0, renderWidth, renderHeight);
    }

    function animate(timeStamp) {
        drawAurora(timeStamp);
        animationFrame = window.requestAnimationFrame(animate);
    }

    function start() {
        resizeCanvas();
        drawAurora(0);

        if (!prefersReducedMotion.matches) {
            animationFrame = window.requestAnimationFrame(animate);
        }
    }

    window.addEventListener("resize", function () {
        resizeCanvas();
        drawAurora(0);
    });

    prefersReducedMotion.addEventListener("change", function () {
        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        start();
    });

    start();
}());
