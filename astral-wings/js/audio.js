export const beep=(f=440)=>{try{const c=new AudioContext(),o=c.createOscillator();o.frequency.value=f;o.connect(c.destination);o.start();o.stop(c.currentTime+.05)}catch{}};
