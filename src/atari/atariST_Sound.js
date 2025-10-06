/*
do do that you only need ym2149c.cpp & .h , API is dumb simple
https://github.com/arnaud-carre/sndh-player/blob/main/AtariAudio/ym2149c.h
void	WritePort(uint8_t port, uint8_t value); to write 8800 & 8802, and
int16_t	ComputeNextSample(); to compute each sample value
cool! Also have an option to use Emscripten to compile directly C/C++ to WebAssembly
*/

function ST_sound_onReset() {
	if (AUDIO_SINGLETON)
		AUDIO_SINGLETON.restart();

	let DMAControl = ST_getCustomFromPtr_W(SND_DMACTRL);
	DMAControl &= 0b1111111111111100; // Sound DMA disabled (reset state).
	ST_setCustomFromPtr(SND_DMACTRL,DMAControl);

	let SndModeControl = ST_getCustomFromPtr_W(SND_MODECTRL);
	SndModeControl &= 0b1111111101111100; // 6258 Hz sample rate, Stereo Mode (reset state).
	ST_setCustomFromPtr(SND_MODECTRL,SndModeControl);

	// set no sound playing
	ST_setCustomFromPtr(SND_FRMADRSCNT_HI,0xffff);
	ST_setCustomFromPtr(SND_FRMADRSCNT_MID,0xffff);
	ST_setCustomFromPtr(SND_FRMADRSCNT_LOW,0xffff);	
}

function ST_sound_onDMAControl(_newValue) {
	// sound
	if (AUDIO_SINGLETON) {
		AUDIO_SINGLETON.restart();
		switch (_newValue & 3) {
			case 0 : 
				ST_setCustomFromPtr(SND_FRMADRSCNT_HI,0xffff);
				ST_setCustomFromPtr(SND_FRMADRSCNT_MID,0xffff);
				ST_setCustomFromPtr(SND_FRMADRSCNT_LOW,0xffff);
			break; // DMA off ==> reset current sound pointer
			case 1 :
			case 2 :
			case 3 :
				let baseAdrs_hi = ST_getCustomFromPtr_W(SND_FRMBASEADRS_HI);
				baseAdrs_hi &= 0b00111111;
				let baseAdrs_mid = ST_getCustomFromPtr_W(SND_FRMBASEADRS_MID);
				baseAdrs_mid &= 0b11111111;
				let baseAdrs_lo = ST_getCustomFromPtr_W(SND_FRMBASEADRS_LOW);
				let baseAdrs = (baseAdrs_hi<<16)|(baseAdrs_mid<<8)|baseAdrs_lo;
	
				ST_setCustomFromPtr(SND_FRMADRSCNT_HI,baseAdrs_hi);
				ST_setCustomFromPtr(SND_FRMADRSCNT_MID,baseAdrs_mid);
				ST_setCustomFromPtr(SND_FRMADRSCNT_LOW,baseAdrs_lo);	
	
				let endAdrs_hi = ST_getCustomFromPtr_W(SND_FRMENDADRS_HI);
				endAdrs_hi &= 0b00111111;
				let endAdrs_mid = ST_getCustomFromPtr_W(SND_FRMENDADRS_MID);
				endAdrs_mid &= 0b11111111;
				let endAdrs_lo = ST_getCustomFromPtr_W(SND_FRMENDADRS_LOW);
				endAdrs_lo &= 0b11111110;
				let endAdrs = (endAdrs_hi<<16)|(endAdrs_mid<<8)|endAdrs_lo;

				const SndModeControl = ST_getCustomFromPtr_W(SND_MODECTRL);
				let freq = NaN;
				switch(SndModeControl & 3) {
					case 0: freq = 6258; break; 
					case 1: freq = 12517; break; 
					case 2: freq = 25033; break; 
					case 3: freq = 50066; break; 
				}
				let channels = 2; // stereo
				if ((SndModeControl & 0b10000000) != 0) channels = 1; // mono
				let test = AUDIO_SINGLETON.memoryToByteArray(baseAdrs, endAdrs);
				let buf = AUDIO_SINGLETON.byteArrayToBuffer(test.data,freq,channels);
				AUDIO_SINGLETON.playBuffer(buf);
				AUDIO_SINGLETON.source.addEventListener('ended', () => {
					ST_setCustomFromPtr(SND_FRMADRSCNT_HI,0xffff);
					ST_setCustomFromPtr(SND_FRMADRSCNT_MID,0xffff);
					ST_setCustomFromPtr(SND_FRMADRSCNT_LOW,0xffff);				
					let DMAControl = ST_getCustomFromPtr_W(SND_DMACTRL);
					DMAControl &= 0b1111111111111100; // Sound DMA disabled (reset state).
					ST_setCustom_W(SND_DMACTRL-ST_CUSTOM_START,DMAControl,false);
				});
			break;
		}	
	}
}

function ST_sound_update() {	
}

