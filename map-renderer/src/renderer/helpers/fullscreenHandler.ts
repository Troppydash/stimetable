// Wrapper around the js fullscreen api
export class FullscreenHandler {

    // handler fullscreen state
    public isFullscreen = false
    // html tag reference
    private root: any = document.getElementsByTagName( 'html' )[0] as any;
    // constructor onclose function
    private readonly callback_fullscreen__onclose: Function;

    // default constructor
    constructor( callback_fullscreen__onclose: Function ) {
        this.callback_fullscreen__onclose = callback_fullscreen__onclose;
    }

    // fullscreen and register onclose handler
    public async openFullscreen() {
        if ( this.isFullscreen ) {
            return;
        }

        if ( this.root.requestFullscreen ) {
            await this.root.requestFullscreen();
        } else if ( this.root.mozRequestFullScreen ) { /* Firefox */
            await this.root.mozRequestFullScreen();
        } else if ( this.root.webkitRequestFullscreen ) { /* Chrome, Safari and Opera */
            await this.root.webkitRequestFullscreen();
        } else if ( this.root.msRequestFullscreen ) { /* IE/Edge */
            await this.root.msRequestFullscreen();
        }

        this.isFullscreen = true;
        const onchange = this.callback_fullscreen__onchange as any;
        document.addEventListener( 'fullscreenchange', onchange );
        document.addEventListener( 'mozfullscreenchange', onchange );
        document.addEventListener( 'MSFullscreenChange', onchange );
        document.addEventListener( 'webkitfullscreenchange', onchange );
    }

    // onclose handler
    private callback_fullscreen__onchange = () => {
        if (!this.isFullscreen) {
            return;
        }
        const doc = document as any;
        if ( doc.webkitIsFullScreen === false || doc.mozFullScreen === false || doc.msFullscreenElement === false ) {
            this.callback_fullscreen__onclose();
        }
    }

    // close fullscreen and remove onclose handler
    public async closeFullscreen() {
        if ( !this.isFullscreen ) {
            return;
        }

        this.isFullscreen = false
        const doc = document as any;
        const onclose = this.callback_fullscreen__onclose as any;
        document.removeEventListener( 'fullscreenchange', onclose );
        document.removeEventListener( 'mozfullscreenchange', onclose );
        document.removeEventListener( 'MSFullscreenChange', onclose );
        document.removeEventListener( 'webkitfullscreenchange', onclose );

        if ( !(doc.webkitIsFullScreen === false || doc.mozFullScreen === false || doc.msFullscreenElement === false) ) {
            if ( doc.exitFullscreen ) {
                await doc.exitFullscreen();
            } else if ( doc.mozCancelFullScreen ) { /* Firefox */
                await doc.mozCancelFullScreen();
            } else if ( doc.webkitExitFullscreen ) { /* Chrome, Safari and Opera */
                await doc.webkitExitFullscreen();
            } else if ( doc.msExitFullscreen ) { /* IE/Edge */
                await doc.msExitFullscreen();
            }
        }
    }
}
