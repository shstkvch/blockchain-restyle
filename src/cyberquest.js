import $ from 'jquery';

$(function() {

	function getChar() {
		return (Math.floor(Math.random()*16)).toString(16);
	}

	var char_width = 14;

	var tick = 0;

	function draw() {
		tick++;

		var width = window.innerWidth / 8;
		var height = window.innerHeight / 16;
		if ( tick % 8 != 0 ) {
			window.requestAnimationFrame( draw );
			return;
		}

		var out = '';

		var x, y;
		for ( y = 0; y < height; y ++ ) {
			for ( x = 0; x < width; x++ ) {
				out += getChar();
			}
			out += '<br/>';
		}

		$('.cyberquest-background').html( out );

		window.requestAnimationFrame( draw );
		
	}

	$(window).resize( function() {
		tick = 0;
	} );


	draw();
})