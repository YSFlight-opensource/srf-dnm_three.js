//srf-dnm_Three.js r1

function SRF_THREE(){//class for manege .srf
    this.Model=new THREE.Geometry();    //'geometry'
    this.ModelMesh=new THREE.Mesh();    //'mesh'
    this.srfdata=new String();
    this.materialIndex=new Array();
    this.wireframe=false;
    
    //function of loading .srf
    this.LoadSrfSync = function(url){
        var req=new XMLHttpRequest();
        req.open('GET',url,false);
        console.log("Begin to load "+url+" ...");
        req.send(null);//error comes,but OK...
        console.log("Finish loading "+url);
        this.srfdata=req.responseText;
        delete req;
    }
    
    //function for making 'geometry'
    this.MakeGeometry=function()
    {
        //check header
        if(!this.srfdata.match(/^surf/i)){
            console.warn("Not Surf!");
        }
        console.log("Analyzing Surf");
        var Modelbuf=new THREE.Geometry();  //init Modelbuf
        var polygons=new Array();           //buffer of polygons with material
        var materials=new Array();          //buffer of materials
        
        //split in line
        var token=this.srfdata.split(/\r|\n|\r\n/);
        
        
        //make 'geometry' by srfdata
        for(var i=1;i<token.length;i++){
            if(token[i].match(/^(V|VER) (\S+) (\S+) (\S+)/)){//vertex line
                Modelbuf.vertices.push(new THREE.Vector3(-RegExp.$2,+RegExp.$3,+RegExp.$4));//push vertex
            }
            else if(token[i].match(/^(F|FAC)/)){    //polygon lines begin
                var polygon=new SurfPolygon();
                i++;
                
                for(;!(token[i].match(/^(E|END)/));i++){   //loop until polygon lines end
                    if(token[i].match(/^(V|VER) (.+)/)){		//if vertex indexes line
                        var use_vertexes= RegExp.$2.split(" ");            //keep vertex indexes
                        for(var j in use_vertexes){
                            polygon.v.push(use_vertexes[j]);
                        }
                        polygon.v.reverse();
			        }
			        else if(token[i].match(/^(C|COL) (.+)/)){   //if color line
					    var cbuf= RegExp.$2.split(" ");		        //cut by ' '
					    if(cbuf.length > 1) {							//if RGBcolor,set
						     polygon.c.setRGB(+cbuf[0]/255,+cbuf[1]/255,+cbuf[2]/255);
					    }
					    else{									//if YScolor,convert before set
					        polygon.c.setRGB(Math.floor(((+cbuf&992)>>5)*255/31),Math.floor(((+cbuf&31744)>>10)*255/31),Math.floor((+cbuf&31)*255/31));
					    }
			        }
			        else if(token[i].match(/^(B|BRI)/)){
			            polygon.e=true;
			            
			        }
			        else if(token[i].match(/^(N|NOR) (\S+) (\S+) (\S+) (\S+) (\S+) (\S+)/)){    //if normal centroid line
			            polygon.g.set(+RegExp.$2,+RegExp.$3,+RegExp.$4);
			            polygon.n.set(+RegExp.$5,+RegExp.$6,+RegExp.$7);
			            if(polygon.n.equals(new THREE.Vector3(0,0,0))){
			                polygon.ds=true;
			            }
			        }
			    }
			    polygons.push(polygon);
            }
            else if(token[i].match(/^(ZA) (.+)/)){
                var za_array = RegExp.$2.split(" ");    //ZA %d %d %d %d    1st %d  has alpha value of 2nd %d,
                                                        //                  3rd %d  has alpha value of 4th %d, ....
			
			    while (za_array.length > 1) {
				    var za_index = za_array.shift();					//get polygon number
				    var za_value = za_array.shift();					//get alpha value
				
				    polygons[za_index].a=+za_value;		//set alpha
                }
            }
            else if(token[i].match(/^(ZL) (.+)/)){
                var zl_array = RegExp.$2.split(" ");    //ZL %d %d %d %d    all %d  is LIGHT
			
			    while (zl_array.length > 1) {
				    var zl_index = zl_array.shift();					//get polygon number
				
				    polygons[zl_index].l=true;		//set LIGHT
                }
            }
        }
        
        //make materials for materialIndex
        for(var i in polygons){
            var color=polygons[i].c;
            var name="("+color.getHex().toString()+")";
            if(polygons[i].e==true){
                name=name+"-BRI";
            }
            if(polygons[i].a>0){
                name=name+"-ZA"+polygons[i].a;
            }
            if(polygons[i].ds==true){
                name=name+"-DS";
            }
            if (polygons[i].l == true) {
                name = name + "-ZL";
            }
            
            var material_index=materials.length;
            for(var j in materials){
                if(materials[j].name==name)
                    material_index=j;
            }
            if (material_index == materials.length) {
                var nm=new Material(name,color,polygons[i].a,polygons[i].e,polygons[i].ds,polygons[i].l);
                materials.push(nm);
            }
            polygons[i].mi=material_index;
        }
        
        //make surfaces in 'geometry'
		for(var i in polygons) {
			if(polygons[i].v.length ==3) {
				var face = new THREE.Face3(+polygons[i].v[0],+polygons[i].v[1],+polygons[i].v[2]);
				face.normal=polygons[i].n;
				face.centroid=polygons[i].g;
				face.materialIndex=polygons[i].mi;
				Modelbuf.faces.push(face);
			}else if(polygons[i].v.length ==4){
				var face = new THREE.Face4(+polygons[i].v[0],+polygons[i].v[1],+polygons[i].v[2],+polygons[i].v[3]);
				face.normal=polygons[i].n;
				face.centroid=polygons[i].g;
				face.materialIndex=polygons[i].mi;
				Modelbuf.faces.push(face);
			}else if(polygons[i].v.length>=5){
				Modelbuf.vertices.push(gra(polygons[i].v,Modelbuf.vertices));
				var face = new THREE.Face3(Modelbuf.vertices.length-1,+polygons[i].v[polygons[i].v.length-1],+polygons[i].v[0]);
				face.normal=polygons[i].n;
				face.centroid=polygons[i].g;
				face.materialIndex=polygons[i].mi;
				Modelbuf.faces.push(face);
				for(var j=polygons[i].v.length-1;j>0;j--){
				   	var face = new THREE.Face3(Modelbuf.vertices.length-1,+polygons[i].v[j-1],+polygons[i].v[j]);
				    face.normal=polygons[i].n;
				    face.centroid=polygons[i].g;
			    	face.materialIndex=polygons[i].mi;
				    Modelbuf.faces.push(face);
				}
			}
		}
		
		//making material
		for(var i in materials){//todo LIGHT with Billboard
		    var adm;
		    if(materials[i].e==1.0){
		        adm=new THREE.MeshPhongMaterial();
		        adm.color=new THREE.Color(0x000000);
		        adm.ambient=new THREE.Color(0x000000);
		        adm.specular=new THREE.Color(0x000000);
		        adm.shininess=0;
		        adm.emissive=materials[i].c;
		        if(materials[i].a!=1){
		            adm.opacity=materials[i].a;
		            adm.transparent=true;
		        }
		        if(materials[i].ds==true){
		            adm.side=THREE.DoubleSide;
		        }
		        adm.wireframe=this.wireframe;
		    }else{
		    	adm=new THREE.MeshPhongMaterial();
		        adm.color=materials[i].c;
		        adm.ambient=new THREE.Color(0x3f3f3f);
		        if(materials[i].a!=1){
		            adm.opacity=materials[i].a;
		            adm.transparent=true;
		        }
		        if(materials[i].ds==true){
		            adm.side=THREE.DoubleSide;
		        }
		        adm.wireframe=this.wireframe;
		    }
		    this.materialIndex.push(adm);
		    delete adm;
		}
		this.Model=Modelbuf;
		delete Modelbuf;
    } //<-End of function'MakeGeometry'
    
    this.EasyMesh = function(url) {
        this.LoadSrfSync(url);
        this.MakeGeometry();
        this.Model.computeFaceNormals();
        this.Model.computeCentroids();
        this.Model.computeVertexNormals();
        this.ModelMesh = new THREE.Mesh(this.Model, new THREE.MeshFaceMaterial(this.materialIndex));
        return this.ModelMesh;
    }
}

function gra(va,mb){
    this.ret=new THREE.Vector3(0, 0, 0);
    for(var i in va){
        this.ret.add(mb[va[i]]);
    }
    this.ret.divideScalar(va.length);
    return this.ret;
}

/***********************************************************
  SurfPolygon CLASS'
   Constructor: SurfPolygon()
***********************************************************/
function SurfPolygon() {
	this.v = new Array();									//vertices index
	this.c = new THREE.Color(255, 255, 255);		        //THREE.Color class
	this.g = new THREE.Vector3(0, 0, 0);					//centroid
	this.n = new THREE.Vector3(0, 0, 0);					//normal
	this.mi = null;                                         //material index
	this.e = false;                                        //emission
	this.a = 0;                                             //alpha
	this.l = false;                                         //light
	this.ds = false;                                        //double side polygon
}
/***********************************************************
  Material CLASS'
   Constructor: Material(name, r, g, b, a, e)
***********************************************************/
function Material(name, c, a, e, ds,l) {
	this.name = name;
	this.c = c;                      //c is  THREE.Color  class
	this.a = (255 - a) / 255; //alpha
	this.l = l;                       //light
	if (e==true)                  //emission
		this.e = 1.000;
	else
		this.e = 0.000;
    this.ds=ds;              //ds is DoubleSide
}