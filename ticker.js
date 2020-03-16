let timeoutHandle

self.onmessage = e => {
    if ( !e.data === 'startTick' ) {
        return
    }

    clearTimeout( timeoutHandle )
    timeoutHandle = setTimeout( () => postMessage( null ), 1000 )
}
