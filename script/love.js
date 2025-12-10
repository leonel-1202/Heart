// Variable Global para almacenar los corazones generados por clic
var clickHearts = []; 

// 1. requestAnimationFrame Polyfill (Tu código original - OK)
window.requestAnimationFrame =
  window.__requestAnimationFrame ||
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (function () {
    return function (callback, element) {
      var lastTime = element.__lastTime || 0;
      var currTime = Date.now();
      var timeToCall = Math.max(1, 33 - (currTime - lastTime));
      window.setTimeout(callback, timeToCall);
      element.__lastTime = currTime + timeToCall;
    };
  })();

window.isDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
  (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
);

var loaded = false;

function init() {
  if (loaded) return;
  loaded = true;
  var mobile = window.isDevice;
  var koef = mobile ? 0.5 : 1;
  var canvas = document.getElementById("heart");
  
  if (!canvas) { // ¡Añadimos esta verificación por seguridad!
        console.error("No se encontró el elemento canvas con id='heart'.");
        return;
    }
    
  var ctx = canvas.getContext("2d");
  var width = (canvas.width = koef * innerWidth);
  var height = (canvas.height = koef * innerHeight);
  var rand = Math.random;

  // Pintar el fondo de negro (o el color que quieras)
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);

  // --- FUNCIONES DE DIBUJO ---
  function drawText() {
    const currentLyricText = document.getElementById("letra").textContent;
    if (currentLyricText) {
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "rgba(53, 174, 255, 1)";
      ctx.textAlign = "center";
      ctx.fillText(currentLyricText, width / 2, height / 2.2 + 250);
    }
  }

  function heartPosition(rad) {
    return [
      Math.pow(Math.sin(rad), 3),
      -(
        15 * Math.cos(rad) -
        5 * Math.cos(2 * rad) -
        2 * Math.cos(3 * rad) -
        Math.cos(4 * rad)
      ),
    ];
  }

  function scaleAndTranslate(pos, sx, sy, dx, dy) {
    return [dx + pos[0] * sx, dy + pos[1] * sy];
  }
  
  function drawHeart(ctx, x, y, scale, color) {
    ctx.fillStyle = color;
    ctx.shadowBlur = 5; 
    ctx.shadowColor = color; 
    ctx.beginPath();
    for (var i = 0; i < Math.PI * 2; i += 0.1) {
      var pos = heartPosition(i);
      // Factor de 0.1 para un tamaño manejable
      var translatedPos = scaleAndTranslate(pos, 0.1 * scale, 0.1 * scale, x, y); 
      
      if (i === 0) {
        ctx.moveTo(translatedPos[0], translatedPos[1]);
      } else {
        ctx.lineTo(translatedPos[0], translatedPos[1]);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; 
  }
  

  // --- EVENT LISTENER PARA EL CLIC DE CORAZONES ---
  canvas.addEventListener("click", function (event) {
    var rect = canvas.getBoundingClientRect();
    var mouseX = (event.clientX - rect.left) * (width / rect.width);
    var mouseY = (event.clientY - rect.top) * (height / rect.height);

    var newHeart = {
      x: mouseX,
      y: mouseY,
      scale: 0.1, 
      opacity: 1, 
      vx: (rand() - 0.5) * 2, 
      vy: -(5 + rand() * 5), 
      gravity: 0.5, 
      life: 60, 
      maxLife: 60,
      color: rand() < 0.5 ? "255, 100, 150" : "255, 200, 200", 
      alive: true
    };
    clickHearts.push(newHeart);
  });
  // --------------------------------------------------

  window.addEventListener("resize", function () {
    width = canvas.width = koef * innerWidth;
    height = canvas.height = koef * innerHeight;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);
  });

  // (Tu código original de las partículas pulsantes...)
  var traceCount = mobile ? 20 : 50;
  var pointsOrigin = [];
  var dr = mobile ? 0.3 : 0.1;
  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 310, 19, 0, 0));
  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 250, 15, 0, 0));
  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 190, 11, 0, 0));

  var heartPointsCount = pointsOrigin.length;
  var targetPoints = [];

  function pulse(kx, ky) {
    for (var i = 0; i < pointsOrigin.length; i++) {
      targetPoints[i] = [
        kx * pointsOrigin[i][0] + width / 2,
        ky * pointsOrigin[i][1] + height / 2.2,
      ];
    }
  }

  var e = [];
  for (var i = 0; i < heartPointsCount; i++) {
    var x = rand() * width;
    var y = rand() * height;
    e[i] = {
      vx: 0,
      vy: 0,
      R: 2,
      speed: rand() + 5,
      q: ~~(rand() * heartPointsCount),
      D: 2 * (i % 2) - 1,
      force: 0.2 * rand() + 0.7,
      f: "rgba(255, 255, 255, 1)",
      trace: Array.from({ length: traceCount }, () => ({ x, y })),
    };
  }

  var config = { traceK: 0.4, timeDelta: 0.6 };
  var time = 0;

  function loop() {
    var n = -Math.cos(time);
    pulse((1 + n) * 0.5, (1 + n) * 0.5);
    time += (Math.sin(time) < 0 ? 9 : n > 0.8 ? 0.2 : 1) * config.timeDelta;

    // Limpiar/Oscurecer el fondo para el rastro
    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.fillRect(0, 0, width, height);

    // Dibujar las partículas pulsantes (Tu código original)
    for (var i = e.length; i--; ) {
      // ... (lógica de las partículas e[i]) ...
        var u = e[i];
        var q = targetPoints[u.q];
        var dx = u.trace[0].x - q[0];
        var dy = u.trace[0].y - q[1];
        var length = Math.sqrt(dx * dx + dy * dy);

        if (length < 10) {
          if (rand() > 0.95) {
            u.q = ~~(rand() * heartPointsCount);
          } else {
            if (rand() > 0.99) u.D *= -1;
            u.q = (u.q + u.D) % heartPointsCount;
            if (u.q < 0) u.q += heartPointsCount;
          }
        }

        u.vx += (-dx / length) * u.speed;
        u.vy += (-dy / length) * u.speed;
        u.trace[0].x += u.vx;
        u.trace[0].y += u.vy;
        u.vx *= u.force;
        u.vy *= u.force;

        for (var k = 0; k < u.trace.length - 1; k++) {
          var T = u.trace[k];
          var N = u.trace[k + 1];
          N.x -= config.traceK * (N.x - T.x);
          N.y -= config.traceK * (N.y - T.y);
        }

        ctx.fillStyle = u.f;
        u.trace.forEach((t) => ctx.fillRect(t.x, t.y, 1, 1));
    }

    // Dibujar y animar los corazones de clic (Lógica de animación mejorada)
    for (let i = clickHearts.length - 1; i >= 0; i--) {
      let heart = clickHearts[i];

      // 1. Actualizar estado (movimiento y vida)
      heart.y += heart.vy;
      heart.x += heart.vx;
      heart.vy += heart.gravity; 
      heart.life--;

      // 2. Calcular animación (escala y opacidad)
      let progress = 1 - (heart.life / heart.maxLife); 

      heart.scale = 1 + (progress * 20); 
      heart.opacity = 1 - (progress * 1.5); 
      
      if (heart.opacity < 0) heart.opacity = 0;

      // 3. Dibujar el corazón
      if (heart.life > 0) {
        let color = `rgba(${heart.color}, ${heart.opacity.toFixed(2)})`;
        drawHeart(ctx, heart.x, heart.y, heart.scale, color);
      } else {
        // 4. Eliminar el corazón
        clickHearts.splice(i, 1);
      }
    }
    

    drawText();
    window.requestAnimationFrame(loop, canvas);
  }

  loop();
}

// --- LÓGICA DE LA MÚSICA Y LETRA (Permanece igual) ---
const rawLyrics = [
    // ... (Tu array de letras completo) ...
  { tiempo: 0.50, duración: 2.80, texto: "Eh-oh, eh-oh, eh-oh, eh-oh, eh-oh" },
  { tiempo: 8.80, duración: 3, texto: "Ya llevo más de dos horas en la barra" },
  { tiempo: 12, duración: 3.40, texto: "De un bar de mierda, con mala música y sin luz" },
  { tiempo: 15, duración: 3.10, texto: "Y solo una cosa no me encaja" },
  { tiempo: 17.60, duración: 5.70, texto: "¿Cómo es que llegaste tú?" },
  { tiempo: 20.70, duración: 4.20, texto: "Me está matando no saberme tu nombre" },
  { tiempo: 23.50, duración: 4.80, texto: "Quiero pensar que tenemos cosas en común" },
  { tiempo: 26.90, duración: 4.20, texto: "Todo mi coraje se me esconde" },
  { tiempo: 30, duración: 4.70, texto: "Desde que llegaste tú" },
  { tiempo: 31.90, duración: 4.90, texto: "Pero sé que planear cómo hablarte" },
  { tiempo: 34.50, duración: 5, texto: "Es perder por cobarde" },
  { tiempo: 37.90, duración: 5, texto: "Y me niego a pensar que llegué" },
  { tiempo: 40, duración: 2.50, texto: "Tres cervezas muy tarde" },
  { tiempo: 43, duración: 3.40, texto: "Yo te veo pasar y grito: eh-oh, eh-oh" },
  { tiempo: 46, duración: 3.40, texto: "Tú tan guapa, pero yo tan feo, eh-oh" },
  { tiempo: 49, duración: 4.80, texto: "Dime cómo logro que te fijes en mí" },
  { tiempo: 52.30, duración: 4.80, texto: "Que, si estoy loco, es porque te conocí" },
  { tiempo: 55.80, duración: 3.40, texto: "Te veo pasar y grito: eh-oh, eh-oh" },
  { tiempo: 57.80, duración: 3.40, texto: "Tú tan guapa, pero yo tan feo y creo" },
  { tiempo: 60.70, duración: 4.80, texto: "Que, aunque estoy borracho, sé que debo admitir" },
  { tiempo: 63.40, duración: 3.80, texto: "Que, si estoy loco, es porque te conocí" },
  { tiempo: 66.80, duración: 2.80, texto: "Porque te conocí" },
  { tiempo: 69, duración: 4.50, texto: "Sé que era inútil que actuara indiferente" },
  { tiempo: 72.15, duración: 4.20, texto: "Solo habría sido alguien más entre la multitud" },
  { tiempo: 75, duración: 4.00, texto: "Perdón si pequé por imprudente" },
  { tiempo: 78, duración: 4.00, texto: "Pero es que llegaste tú" },
  { tiempo: 80.40, duración: 3.80, texto: "Yo solo quiero perderme en tu pelo" },
  { tiempo: 82.90, duración: 3.50, texto: "Y le agradezco al cielo que te conocí (eh)" },
  { tiempo: 86, duración: 3.70, texto: "Cuando me miras, se acelera el pulso" },
  { tiempo: 88.80, duración: 3.70, texto: "Y solo es un impulso que me sale si" },
  { tiempo: 91, duración: 3.40, texto: "Yo te veo pasar y grito: eh-oh, eh-oh" },
  { tiempo: 93.80, duración: 3.40, texto: "Tú tan guapa, pero yo tan feo, eh-oh" },
  { tiempo: 96.90, duración: 3.90, texto: "Dime cómo logro que te fijes en mí" },
  { tiempo: 99.90, duración: 4.20, texto: "Que, si estoy loco, es porque te conocí" },
  { tiempo: 102.60, duración: 3.40, texto: "Te veo pasar y grito: eh-oh, eh-oh" },
  { tiempo: 105.80, duración: 3.40, texto: "Tú tan guapa, pero yo tan feo y creo" },
  { tiempo: 108.60, duración: 4.20, texto: "Que, aunque estoy borracho, sé que debo admitir" },
  { tiempo: 111.90, duración: 3.90, texto: "Que, si estoy loco, es porque te conocí" },
  { tiempo: 115, duración: 2.50, texto: "Porque te conocí" },
  { tiempo: 117, duración: 3.50, texto: "Eh-oh, eh-oh (eh-oh)" },
  { tiempo: 119, duración: 3.50, texto: "Eh-oh, eh-oh (eh)" },
  { tiempo: 122, duración: 3.00, texto: "Pero sé que planear cómo hablarte" },
  { tiempo: 125, duración: 3.30, texto: "Es perder por cobarde" },
  { tiempo: 127.30, duración: 3.50, texto: "Y me niego a pensar que llegué" },
  { tiempo: 130, duración: 3.50, texto: "Tres cervezas muy tarde" },
  { tiempo: 133.50, duración: 3.80, texto: "Yo te veo pasar y grito: eh-oh, eh-oh" },
  { tiempo: 136, duración: 3.80, texto: "Tú tan guapa, pero yo tan feo, eh-oh" },
  { tiempo: 139, duración: 3.00, texto: "Dime cómo logro que te fijes en mí (oh)" },
  { tiempo: 142, duración: 3.50, texto: "Que, si estoy loco, es porque te conocí (te conocí)" },
  { tiempo: 145, duración: 3.80, texto: "Te veo pasar y grito: eh-oh, eh-oh" },
  { tiempo: 148, duración: 3.00, texto: "Tú tan guapa, pero yo tan feo y creo (tan feo)" },
  { tiempo: 151.30, duración: 3.80, texto: "Que, aunque estoy borracho, sé que debo admitir" },
  { tiempo: 154, duración: 4.00, texto: "Que, si estoy loco, es porque te conocí (te conocí)" },
  { tiempo: 157, duración: 2.00, texto: "Porque te conocí" },
  { tiempo: 159, duración: 5.00, texto:" 🤍🤍"},
];

let currentLyricIndex = 0;

function syncLyrics() {
  const music = document.getElementById("backgroundMusic");
  const box = document.getElementById("letra");
  if (!music || !box) return;
  const t = music.currentTime;
  if (currentLyricIndex >= rawLyrics.length) {
    if (box.textContent !== "") box.textContent = "";
    return;
  }
  const currentLine = rawLyrics[currentLyricIndex];
  const nextLine = rawLyrics[currentLyricIndex + 1];
  if (currentLine) {
    if (t >= currentLine.tiempo && box.textContent !== currentLine.texto)
      box.textContent = currentLine.texto;
    if (nextLine && t >= nextLine.tiempo) {
      currentLyricIndex++;
      box.textContent = nextLine.texto;
    } else if (t > currentLine.tiempo + currentLine.duración) {
      box.textContent = "";
    }
  }
}

// ** FUNCIÓN continueMusic REPARADA **
function continueMusic() {
  const music = document.getElementById("backgroundMusic");
  const canvas = document.getElementById("heart");
  if (!music || !canvas) return;
  
  // Usa un listener temporal para el primer clic que inicia la música.
  document.addEventListener("click", () => { 
    // Aseguramos que la música solo intente iniciarse una vez
    currentLyricIndex = 0;
    music.addEventListener("timeupdate", syncLyrics);
    music.play().catch(() => {});
  }, { once: true }); 
  
  // NOTA: El listener para dibujar los corazones ya está en 'init' y es permanente.
}

document.addEventListener("DOMContentLoaded", function () {
  init();
  continueMusic();
});