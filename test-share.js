// Test the share functionality
const generateRoomId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const handleShare = async () => {
  const roomId = generateRoomId();
  const password = generatePassword();
  const shareUrl = `http://localhost:3000/collaborate/${roomId}?password=${password}`;
  
  console.log('Generated share URL:', shareUrl);
  console.log('Room ID:', roomId);
  console.log('Password:', password);
  
  return shareUrl;
};

// Test the function
handleShare().then(url => {
  console.log('Share functionality test completed successfully!');
  console.log('Share URL:', url);
}).catch(error => {
  console.error('Test failed:', error);
});
