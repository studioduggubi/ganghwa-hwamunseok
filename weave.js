/* A material study of sedge and binding thread, informed by PR015-A005.
   Procedural visual interpretation, not a simulation of the production technique.
   One WebGL draw per frame; sleeps when still, hidden or outside the hero. */
(() => {
  'use strict';
  const section = document.querySelector('.opening');
  const stage = section?.querySelector('.opening-stage');
  const canvas = section?.querySelector('.hero-weave');
  const replay = document.querySelector('#weave-replay');
  const photo = section?.querySelector('.hero-image img');
  if (!canvas || !stage || !photo) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gl = canvas.getContext('webgl', { alpha:false, antialias:false, depth:false, stencil:false, powerPreference:'low-power' });
  if (!gl) return;
  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision highp float;
    varying vec2 uv;
    uniform vec2 resolution;
    uniform vec2 pointer;
    uniform float pressure;
    uniform float progress;
    uniform float reveal;
    uniform float time;
    uniform sampler2D photograph;
    uniform vec2 photoSize;
    float hash(float n){return fract(sin(n*127.1)*43758.5453);}
    float smoothBand(float a,float b,float x){return smoothstep(a,a+.035,x)*(1.-smoothstep(b-.035,b,x));}
    vec3 photoAt(vec2 p){
      float viewAspect=resolution.x/resolution.y;
      float imageAspect=photoSize.x/photoSize.y;
      vec2 crop=vec2(min(1.,viewAspect/imageAspect),min(1.,imageAspect/viewAspect));
      vec2 pos=resolution.x<760.?vec2(.58,.5):vec2(.55,.58);
      vec2 st=p*crop+(1.-crop)*pos;
      return texture2D(photograph,st).rgb;
    }
    void main(){
      vec2 screen=vec2(uv.x,1.-uv.y);
      vec2 px=screen*resolution;
      vec2 delta=px-pointer;
      float distance=length(delta);
      float touch=exp(-distance*distance/55000.)*pressure;
      // Subtle elastic displacement follows a hand; no perpetual wave loop.
      vec2 moved=px+vec2(sin(delta.y*.012)*10.,sin(delta.x*.012)*7.)*touch;
      float scale=clamp(resolution.x/1440.,.65,1.2);
      vec2 q=(moved-resolution*.5)/scale;
      // Large, gently curved reeds cross paired fine binding threads.
      q.x+=q.y*.20+q.y*q.y*.00012;
      float column=floor(q.x/12.);
      float irregular=(hash(column)-.5)*1.15;
      float reedX=fract((q.x+irregular)/12.);
      float row=floor((q.y+sin(column*.23)*.9)/34.);
      float threadY=fract((q.y+sin(column*.23)*.9)/34.);
      float reed=smoothBand(.07,.94,reedX);
      float rounded=pow(max(0.,sin(clamp((reedX-.06)/.89,0.,1.)*3.14159)),.38);
      float fineFibers=sin(q.x*4.2+hash(column)*20.+sin(q.y*.021)*.5)*.025;
      float fiber=sin(q.x*1.4+sin(q.y*.014))*.032+fineFibers;
      float natural=hash(column)*.12+sin(q.y*.008+column)*.024;
      vec3 actual=photoAt(screen);
      // Natural straw is the hero material; brand indigo stays in the interface.
      vec3 palette=photoAt(vec2(clamp(screen.x*.88+.06,0.,1.),clamp(screen.y*.8+.1,0.,1.)));
      float motif=clamp((palette.g-palette.b)*5.,0.,1.);
      vec3 straw=vec3(.80,.73,.58);
      vec3 gold=vec3(.72,.62,.43);
      vec3 reedColor=mix(straw,vec3(.63,.55,.39),motif*.72);
      reedColor*=.67+rounded*.42+natural+fiber;
      float joint=1.-smoothstep(.015,.07,min(abs(threadY-.44),abs(threadY-.53)));
      float over=mod(column+row,2.);
      float crossingShade=exp(-pow((threadY-.49)*9.,2.))*.19;
      reedColor*=1.-crossingShade;
      vec3 binding=mix(vec3(.37,.32,.23),vec3(.78,.72,.58),rounded*.65+over*.22);
      vec3 woven=mix(vec3(.14,.115,.08),reedColor,reed);
      woven=mix(woven,binding,joint*(.56+over*.30));
      // Alternate rows travel in opposite directions, like a shuttle.
      float direction=mod(row,2.)<1.?screen.x:1.-screen.x;
      float rowOrder=screen.y*.56+direction*.28+hash(row)*.06;
      float wovenIn=smoothstep(rowOrder-.055,rowOrder+.035,progress*1.16-.08);
      float warpIn=smoothstep(screen.y*.35,screen.y*.35+.15,progress*1.5+.16);
      vec3 waiting=vec3(.12,.10,.075)+reed*straw*.24*warpIn;
      waiting+=joint*gold*.12*warpIn;
      vec3 color=mix(waiting,woven,wovenIn);
      // Soft directional raking light makes each strand legible.
      float ambient=exp(-pow((screen.x-.75)*1.4,2.)-pow((screen.y-.35)*1.0,2.));
      color*=.73+ambient*.30;
      color+=touch*(.055+rounded*.10)*vec3(.90,.80,.57)*wovenIn;
      float frontier=(1.-abs(wovenIn*2.-1.))*.07;
      color+=frontier*gold;
      // Scrolling resolves the illustration into its original photograph.
      color=mix(color,actual,smoothstep(.12,.72,reveal));
      gl_FragColor=vec4(color,1.);
    }`;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader); throw new Error('Weave shader unavailable');
    }
    return shader;
  };
  let program;
  try {
    program=gl.createProgram();
    const shaders=[compile(gl.VERTEX_SHADER,vertex),compile(gl.FRAGMENT_SHADER,fragment)];
    shaders.forEach(shader=>gl.attachShader(program,shader));gl.linkProgram(program);
    shaders.forEach(shader=>gl.deleteShader(shader));
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Weave program unavailable');
  } catch { return; }
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uniforms={};
  ['resolution','pointer','pressure','progress','reveal','time','photograph','photoSize'].forEach(key=>uniforms[key]=gl.getUniformLocation(program,key));
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  let width=1,height=1,frame=0,ready=false,visible=true,lost=false;
  let duration=0,last=0,intro=0,currentPressure=0,targetPressure=0;
  let x=0,y=0,targetX=0,targetY=0,scrollProgress=0;
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
  function wake(){if(ready&&!frame&&visible&&!document.hidden&&!reduced.matches&&!lost)frame=requestAnimationFrame(draw);}
  function resize(){
    width=stage.clientWidth;height=stage.clientHeight;
    const ratio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1800000/(width*height)));
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    gl.viewport(0,0,canvas.width,canvas.height);
    if(!x){x=targetX=width*.72;y=targetY=height*.44;}
    updateScroll();wake();
  }
  function updateScroll(){
    scrollProgress=Math.max(0,Math.min(1,-section.getBoundingClientRect().top/Math.max(1,section.offsetHeight-innerHeight)));
    wake();
  }
  function draw(now){
    frame=0;
    if(!ready||!visible||document.hidden||reduced.matches||lost)return;
    const dt=Math.min(last?(now-last)/1000:1/60,.05);last=now;
    duration+=dt;intro=Math.min(1,duration/3.6);
    const ease=1-Math.exp(-dt*8);
    x+=(targetX-x)*ease;y+=(targetY-y)*ease;
    currentPressure+=(targetPressure-currentPressure)*ease;
    gl.uniform2f(uniforms.resolution,width,height);
    gl.uniform2f(uniforms.pointer,x,y);
    gl.uniform1f(uniforms.pressure,currentPressure);
    gl.uniform1f(uniforms.progress,intro);
    gl.uniform1f(uniforms.reveal,scrollProgress);
    gl.uniform1f(uniforms.time,duration);
    gl.drawArrays(gl.TRIANGLES,0,6);
    canvas.dataset.phase=intro<1?'weaving':'woven';
    if(intro<1||Math.abs(targetPressure-currentPressure)>.002||Math.abs(targetX-x)+Math.abs(targetY-y)>.2)wake();
    else last=0;
  }
  function updatePreference(){
    section.classList.toggle('weave-ready',ready&&!reduced.matches&&!lost);
    replay.hidden=!ready||reduced.matches||lost;
    if(reduced.matches)stop();else wake();
  }
  function start(){
    if(ready||!photo.naturalWidth)return;
    try {
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,photo);
      gl.uniform1i(uniforms.photograph,0);
      gl.uniform2f(uniforms.photoSize,photo.naturalWidth,photo.naturalHeight);
      ready=true;resize();updatePreference();
    } catch { stop(); }
  }
  function point(event){
    if(event.target.closest('a,button'))return;
    const rect=stage.getBoundingClientRect();
    targetX=event.clientX-rect.left;targetY=event.clientY-rect.top;
    targetPressure=1;wake();
  }
  stage.addEventListener('pointermove',event=>{if(event.pointerType!=='touch')point(event);},{passive:true});
  stage.addEventListener('pointerdown',point,{passive:true});
  stage.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse'){targetPressure=0;wake();}},{passive:true});
  ['pointerleave','pointercancel'].forEach(name=>stage.addEventListener(name,()=>{targetPressure=0;wake();},{passive:true}));
  replay.addEventListener('click',()=>{duration=0;last=0;targetPressure=0;wake();});
  addEventListener('scroll',updateScroll,{passive:true});
  addEventListener('resize',resize,{passive:true});
  reduced.addEventListener('change',updatePreference);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else wake();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else stop();},{threshold:0}).observe(section);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;stop();updatePreference();});
  photo.addEventListener('load',start,{once:true});
  if(photo.complete)start();
})();
