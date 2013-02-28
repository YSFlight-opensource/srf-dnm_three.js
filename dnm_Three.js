//srf-dnm_Three.js r1

var YSangle2Radian=Math.PI/32768;   //YSangle2Radian 32768 = Radian PI

function DNM_THREE(){//class for manege .dnm
    this.Model=new THREE.Object3D();    //'geometry'
    this.dnmdata=new String();
    this.PCKnodes=new Array();          //Array of Mesh
    this.SRFnodes=new Array();          //Array of Object3D
    this.wireframe=false;
    this.version=0;                     //DNMVER
    
    //function of loading .dnm
    this.LoadDnmSync = function(url){
        var req=new XMLHttpRequest();
        req.open('GET',url,false);
        console.log("Begin to load "+url+" ...");
        req.send(null);//error comes,but OK...
        console.log("Finish loading "+url);
        this.dnmdata=req.responseText;
        delete req;
    }
    
    this.MakeObject3D=function(){
        if(!this.dnmdata.match(/^dynamodel/i)){
            console.warn("Not DynaModel!");
        }
        console.log("Analyzing DynaModel");
        var token=this.dnmdata.split(/\r\n/);
        for(var i=1;i<token.length;i++){
            if(token[i].match(/^DNMVER\s+(\d)/)){                //Header(Version)
                this.vertion=RegExp.$1;
            }else if(token[i].match(/^PCK\s+(\S+)\s+(\d+)/)){   //PCK node
                var pck=new SRF_THREE();
                var nm=RegExp.$1;
                for(j=1;j<=RegExp.$2;j++){
                    if(token[i+j])
                        pck.srfdata+=token[i+j]+"\r\n";   //surfdata input
                }
                pck.wireframe=this.wireframe;
                pck.MakeGeometry();
                pck.Model.computeFaceNormals();
	            pck.Model.computeCentroids();
	            pck.Model.computeVertexNormals();
	            var mesh=new THREE.Mesh(pck.Model,new THREE.MeshFaceMaterial(pck.materialIndex));
	            mesh.name=nm;
                this.PCKnodes.push(mesh);
            }else if(token[i].match(/^SRF\s+\"(\S+)\"/)){   //SRF node
                var srf=new SRF_NODE();
                srf.SRF=RegExp.$1;                              //ID
                for(j=1;!token[i+j].match(/^(E|END)/);j++){
                    if(token[i+j].match(/^FIL\s+(\S+)/)){
                        srf.FIL=RegExp.$1;                      //srf file
                    }else if(token[i+j].match(/^CLA\s+(\d+)/)){
                        srf.CLA=RegExp.$1;
                    }else if(token[i+j].match(/^NST\s+(\d)/)){
                        srf.NST=RegExp.$1;
                    }else if(token[i+j].match(/^STA\s+(.+)/)){
                        var elem=RegExp.$1.split(" ");
                        var sta=new SRF_NODE_STAPOS();
                        sta.position=new THREE.Vector3(+elem[0],+elem[1],+elem[2]);
                        sta.rotation=new THREE.Vector3(-elem[4]*YSangle2Radian,+elem[3]*YSangle2Radian,-elem[5]*YSangle2Radian);
                                                                                            //YSangle -> radian
                        if(+elem[6]==1){
                            sta.visible=true;
                        }else{
                            sta.visible=false;
                        }

                        srf.STA.push(sta);
                    }else if(token[i+j].match(/^POS\s+(.+)/)){
                        var elem=RegExp.$1.split(" ");
                        srf.POS.position=new THREE.Vector3(-elem[0],+elem[1],+elem[2]);;
                        srf.POS.rotation=new THREE.Vector3(-elem[4]*YSangle2Radian,+elem[3]*YSangle2Radian,-elem[5]*YSangle2Radian);
                                                                                            //YSangle -> radian
                        if(elem[6]==1){
                            srf.POS.visible=true;
                        }else{
                            srf.POS.visible=false;
                        }
                    }else if(token[i+j].match(/^CNT\s+(.+)/)){
                        var elem=RegExp.$1.split(" ");
                        srf.CNT=new THREE.Vector3(+elem[0],-elem[1],-elem[2]);
                    }else if(token[i+j].match(/^NCH\s+(\d+)/)){
                        srf.NCH=RegExp.$1;
                    }else if(token[i+j].match(/^CLD\s+\"(\S+)\"/)){
                        srf.CLD.push(RegExp.$1);
                    }
                }
                if(srf.NST==srf.STA.length){
                    this.SRFnodes.push(srf);
                }   
            }
        }
		//varify SRF nodes
		for(var i in this.SRFnodes){
		    for(var j in this.PCKnodes){
		        if(this.PCKnodes[j].name===this.SRFnodes[i].FIL){
		            this.SRFnodes[i].Mesh=this.PCKnodes[j].clone();
		            break;
		        }
		    }
		    this.SRFnodes[i].setting();
		    this.Model.add(this.SRFnodes[i].priobj);
		    
		}
		
		//joint SRF nodes
		for(var i in this.SRFnodes){
		    for(var j in this.SRFnodes){
		        for(var k=this.SRFnodes[i].CLD.length-1;k>=0;k--){;
		            if(this.SRFnodes[i].CLD[k]==this.SRFnodes[j].SRF){
		                this.Model.remove(this.SRFnodes[j].priobj);
		                this.SRFnodes[i].terobj.add(this.SRFnodes[j].priobj);
		            }
		        }
		    }
		}
    }//<-End of function, 'MakeObject3D'
    
    this.ChangeStatus=function(cla,num){
        for(var i in this.SRFnodes){
            if(this.SRFnodes[i].CLA==cla){
                if(this.SRFnodes[i].STA.length==0){
                    continue;
                }
				this.SRFnodes[i].secobj.position=this.SRFnodes[i].STA[num].position;
				this.SRFnodes[i].secobj.rotation=this.SRFnodes[i].STA[num].rotation;
				this.SRFnodes[i].Mesh.visible=this.SRFnodes[i].STA[num].visible;
            }
        }
    }
}

/***********************************************************
  SRF node CLASS
   Constructor: SRF_NODE()
***********************************************************/
function SRF_NODE() {
    this.SRF=new String();      //ID
    this.FIL=new String();      //PCK node
    this.CLA=0;
    this.NST=0;
    this.STA=new Array();   //max 3
    this.POS=new SRF_NODE_STAPOS();
    this.CNT=new THREE.Vector3(0,0,0);
    this.NCH=0;
    this.CLD=new Array();
    
    this.priobj=new THREE.Object3D();
    this.secobj=new THREE.Object3D();
    this.terobj=new THREE.Object3D();
    this.Mesh=new THREE.Mesh();
    
    this.setting=function(){
        this.priobj.position=this.POS.position;
        this.priobj.rotation=this.POS.rotation;
        
        if(this.STA.length!=0){
            this.secobj.position=this.STA[0].position;
            this.secobj.rotation=this.STA[0].rotation;
            this.Mesh.visible=this.STA[0].visible;
        }
        
        this.terobj.position=this.CNT;
        this.terobj.rotation=new THREE.Vector3(0,0,0);
        
        this.priobj.add(this.secobj);
        this.secobj.add(this.terobj);
        this.terobj.add(this.Mesh);
    }
}

/*
Layer is

POSpos
POSrot
STApos
STArot
-POSrot
-POSpos
POSpos
POSrot
CNTpos
Mesh    (geometry)

So,

1st POSpos         POSrot
2nd STApos         STArot
3rd CNTpos         non
*/



/***********************************************************
  SRF node STA POS CLASS
   Constructor: SRF_NODE_STAPOS()
***********************************************************/
function SRF_NODE_STAPOS(){					//STA|POS
    this.position=new THREE.Vector3(0,0,0); //0.00 0.00 0.00
    this.rotation=new THREE.Vector3(0,0,0); //0 0 0
    this.visible=new Boolean(true); 		//1
}