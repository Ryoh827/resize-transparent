import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import DateFormat from 'dateformat';
import { promisify } from 'util';
import Jimp from 'jimp';

async function convert(filePath, newWidth, newHeight) {
  try {
    let pathName = '';
    const staticDirPath = path.resolve(__dirname, '..', 'static', filePath);
    if (fs.existsSync(filePath)) {
      pathName = filePath;
    } else if (fs.existsSync(staticDirPath)) {
      pathName = staticDirPath;
    } else {
      throw 'No such file';
    }

    const date = DateFormat(new Date(), 'yyyymmdd');
    const newFileName = `${path.basename(
      pathName,
      path.extname(pathName),
    )}_${date}.png`;
    const tmpFilePath = path.resolve(
      __dirname,
      '..',
      'static',
      `_${newFileName}`,
    );
    const newFilePath = path.resolve(__dirname, '..', 'static', newFileName);

    await (await Jimp.read(pathName))
      .resize(newWidth, newHeight)
      .writeAsync(tmpFilePath);

    const canvas = createCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d');
    const image = await loadImage(tmpFilePath);
    await promisify(fs.unlink)(tmpFilePath);
    ctx.drawImage(image, 0, 0, image.width, image.height);

    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    const limit = imageData.width * imageData.height;
    const range = { min: 250, max: 255 };
    for (let i = 0; i < limit; i++) {
      const index = i * 4;
      if (
        imageData.data[index] >= range.min &&
        imageData.data[index] <= range.max && // R
        imageData.data[index + 1] >= range.min &&
        imageData.data[index + 1] <= range.max && // G
        imageData.data[index + 2] >= range.min &&
        imageData.data[index + 2] <= range.max // B
      ) {
        imageData.data[index + 3] = 0; // A
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const buf = canvas.toBuffer();
    await promisify(fs.writeFile)(newFilePath, buf);
    console.log(`Complete ${newFileName}`);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

if (process.argv.length !== 5) {
  console.log('Usage: yarn convert FILE_PATH NEW_WIDTH NEW_HEIGHT');
  process.exit(1);
}

convert(process.argv[2], Number(process.argv[3]), Number(process.argv[4]));
