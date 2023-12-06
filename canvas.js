const easeIn = (t, b, c, d) => {
  return c * (t /= d) * t + b;
}

const easeOut = (t, b, c, d) => {
  return -c * (t /= d) * (t - 2) + b;
}

const easeInOut = (t, b, c, d) => {
  if ((t /= d / 2) < 1) return c / 2 * t * t + b;
  return -c / 2 * ((--t) * (t - 2) - 1) + b;
}

const initTextDrawer = async (selector, fontSize) => {
  const font = new FontFace("MiSans-Light", "url(./MiSans-Light.ttf)")
  const canvas = document.querySelector(selector);
  const ctx = canvas.getContext('2d');
  const cwidth = canvas.width = window.innerWidth;
  const cheight = canvas.height = window.innerHeight;
  const centerX = cwidth / 2;
  const centerY = cheight / 2;

  await font.load()

  const getPointPositions = (text) => {
    const canvas = document.createElement('canvas');
    
    canvas.width = cwidth;
    canvas.height = cheight;

    const ctx = canvas.getContext('2d');

    ctx.font = `${fontSize}px MiSans-Light`;
    
    let width = ctx.measureText(text).width;
    let height = fontSize;

    let processedText1 = [text];

    while (width > canvas.width * 0.8) {
      // 循环切分文字，宽度不超过画布宽带的80%
      for (let i = 0; i < processedText1.length; i++) {
        let text = processedText1[i];
        let textWidth = ctx.measureText(text).width;
        if (textWidth > canvas.width * 0.8) {
          let text1 = text.substr(0, text.length / 2);
          let text2 = text.substr(text.length / 2);
          processedText1.splice(i, 1, text1, text2);
        }
      }

      width = ctx.measureText(processedText1[0]).width;
      height = processedText1.length * fontSize;
    }

    const textPositions = [];

    for (let i = 0; i < processedText1.length; i++) {
      let text = processedText1[i];
      let textWidth = ctx.measureText(text).width;
      let x = (canvas.width - textWidth) / 2;
      let y = (canvas.height - height) / 2 + i * fontSize + fontSize;
      textPositions.push({ text, x, y });
    }

    for (let i = 0; i < textPositions.length; i++) {
      let text = textPositions[i].text;
      let textWidth = ctx.measureText(text).width;
      let x = (canvas.width - textWidth) / 2;
      let y = (canvas.height - height) / 2 + i * fontSize + fontSize;
      ctx.fillText(text, x, y);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const positions = [];

    // 2x2像素取点
    for (let x = 0; x < imageData.width; x += 6) {
      for (let y = 0; y < imageData.height; y += 6) {
        let i = (y * imageData.width + x) * 4;
        if (imageData.data[i + 3] > 16) {
          positions.push({ x, y });
        }
      }
    }

    return positions;
  }

  let prev = ''

  const draw = (text, targetTime = 100) => {
    const point = (x, y) => {
      // 绘制半径为2的圆点，白色背景，box-shadow效果
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fill();
    }

    const currentPositions = getPointPositions(text);
    const prevPositions = getPointPositions(prev);

    let time = 0
    const loop = () => {
      const start = Date.now()
      // 清空画布
      ctx.clearRect(0, 0, cwidth, cheight);
      // 计算每个点的位置
      for (let i = 0; i < currentPositions.length; i++) {
        let current = currentPositions[i];
        let prev = prevPositions[i];

        const prevX = prev ? prev.x : centerX
        const prevY = prev ? prev.y : centerY

        const x = easeInOut(time, prevX, current.x - prevX, targetTime)
        const y = easeInOut(time, prevY, current.y - prevY, targetTime)
        point(x, y);
      }

      // 多出来的点移动到画布外面
      for (let i = currentPositions.length; i < prevPositions.length; i++) {
        let prev = prevPositions[i];

        const prevX = prev ? prev.x : centerX
        const prevY = prev ? prev.y : centerY
        const targetX = prevX < centerX ? -100 : cwidth + 100
        const targetY = prevY < centerY ? -100 : cheight + 100

        const x = easeInOut(time, prevX, targetX - prevX, targetTime)
        const y = easeInOut(time, prevY, targetY - prevY, targetTime)
        point(x, y);
      }

      const duration = Date.now() - start
      time = time + duration

      if (time < targetTime) {
        requestAnimationFrame(loop)
      }
    }

    loop()

    prev = text
  }

  return {
    draw
  }
}

window.initTextDrawer = initTextDrawer;

initTextDrawer('#text', 160).then(d => window.d = d)

// d.draw('Hello World', 100)