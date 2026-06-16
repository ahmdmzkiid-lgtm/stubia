const cloudinary = require('cloudinary').v2;

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: 'dcnkhhxz8',
  api_key: '928932681474484',
  api_secret: 'NbI_aLANJtfjq16J1fkSPTehrqI'
});

// Logo PTN dari sumber yang reliable
const images = [
  {
    url: 'https://seeklogo.com/images/U/universitas-indonesia-ui-logo-3B4E349A6B-seeklogo.com.png',
    public_id: 'ptn/logo-ui'
  },
  {
    url: 'https://seeklogo.com/images/I/institut-teknologi-bandung-itb-logo-A8F6C4E7A2-seeklogo.com.png',
    public_id: 'ptn/logo-itb'
  }
];

async function uploadImages() {
  console.log('Uploading PTN images to Cloudinary...\n');
  
  for (const img of images) {
    try {
      const result = await cloudinary.uploader.upload(img.url, {
        public_id: img.public_id,
        overwrite: true,
        resource_type: 'image'
      });
      console.log(`✓ Uploaded: ${img.public_id}`);
      console.log(`  URL: ${result.secure_url}\n`);
    } catch (error) {
      console.error(`✗ Failed: ${img.public_id}`);
      console.error(`  Error: ${error.message}\n`);
    }
  }
  
  console.log('Done!');
}

uploadImages();
