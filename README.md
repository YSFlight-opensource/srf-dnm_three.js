srf-dnm.three.js
================
	srf.three.js is a srf importer for three.js .
	dnm.three.js is a dnm importer for three.js .
	(srf & dnm is the model for YSFlight Simulator)

Usage(srf.three.js)
-----
	<!doctype html>
	<html>
		<head>
			<meta charset="UTF-8" />
			<script src="three.js"></script>
			<script src="srf.three.js"></script>
			<script>
				var camera, scene, renderer;
				
				function init() {
					width = document.getElementById('maincanvas1').clientWidth;
					height = document.getElementById('maincanvas1').clientHeight; 
					
					scene = new THREE.Scene();
				
					camera = new THREE.PerspectiveCamera( 45, width / height, 1, 1000 );
					camera.position.z = 15;
					camera.lookAt(new THREE.Vector3(0,0,0));
				    scene.add(camera);
				    
					scene.add( new THREE.HemisphereLight(0x7f7f7f));
					scene.add( new THREE.AmbientLight(0x3f3f3f));
					
					test=new SRF_THREE();
					scene.add(test.EasyMesh("foobar.srf"));
				    
					renderer = new THREE.WebGLRenderer();
					renderer.setSize( width, height );
					
					document.getElementById('maincanvas1').appendChild(renderer.domElement);
				}
				
				function animate() {		
					// note: three.js includes requestAnimationFrame shim
					requestAnimationFrame( animate );
					
					renderer.render( scene, camera );
				}
				
				function start(){
					init();
					animate();
				}
			</script>
		</head>
		<body style="margin:0px; padding:0px; background-color:#ffffff" onload="start();">
			<div id="maincanvas1" style="width: 900px;height: 645px;background-color: #000000;"></div>
		</body>
	</html>

Thanks
-----
	Club-Raptor(Inventer of Surf Analyzing Algorithm by Perl)
		朝飯中隊駐機場 http://raptor.ddo.jp/asameshi/index.shtml ->スクリプト ->Srf2Mqo,Dnm2Mqo
	
	
	Alphalpha(Auther of Surf Analyzing Algorithm by JavaScript)
		C. K. Packs http://raptor.ddo.jp/ckpacks/ ->TOOL&PLUGIN ->JavaScriptによるmqo2srfとsrf2mqo
		
		Changes from 'JavaScriptによるsrf2mqo':
			SurfPolygon CLASS & Material CLASS
			omit some processe(ex. set vertexes directly)
			read srfdata from internal string(srf2mqo one is from external .srf file)
	
	
	CaptainYS(YSFlight developer)
		ysflight.com http://ysflight.com/
