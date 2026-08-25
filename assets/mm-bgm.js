/* ============================================================
   MOONOI MONSOON — 共有BGM (mm-bgm.js)
   ------------------------------------------------------------
   ハブと全アプリで同じ音を鳴らすための1ファイル。
   すべて同じドメイン(moonoimonsoon.github.io)で配信されるので、
   各ページから <script src="/assets/mm-bgm.js"></script> で読める。

   ・メニュー/トップ画面 = 夜の虫と遠いパッド
   ・プレイ中           = ミニマル・パルス / シンギングボウル /
                          オルガン・パッド / 風鈴 / 静かなアルペジオ
                          をプレイのたびに順番に入れ替え
   ・音源ファイルは使わず、その場で合成する(著作権フリー・読込ゼロ)

   使い方:
     MMBGM.scene('menu')  … メニューBGMへ
     MMBGM.scene('game')  … プレイ中BGMへ(呼ぶたびに次の曲へ)
     MMBGM.scene('off')   … 止める
   何も呼ばなければ、最初の操作でメニューBGMが鳴り始める。

   ON/OFFと曲順はlocalStorageに保存。タイピングマスターと同じキーなので、
   どこかで消せば全アプリで消える。
   ============================================================ */
(function(){
"use strict";
if(window.MMBGM) return;

var AUDIO_KEY='mm_thai_typing_audio_v1';   /* {bgm:bool, se:bool} */
var IDX_KEY='mm_thai_typing_bgm_idx';      /* プレイ中BGMの順番 */
var GAME_ROT=['l','k','n','o','h'];

var ctx=null, cur=null, bgmOn=true, started=false;

try{ var st=JSON.parse(localStorage.getItem(AUDIO_KEY)); if(st) bgmOn=(st.bgm!==false); }catch(e){}
function saveOn(){
  try{
    var st={}; try{ st=JSON.parse(localStorage.getItem(AUDIO_KEY))||{}; }catch(e2){}
    st.bgm=bgmOn; localStorage.setItem(AUDIO_KEY,JSON.stringify(st));
  }catch(e){}
}
function ac(){
  if(!ctx){ var C=window.AudioContext||window.webkitAudioContext; if(!C) return null; ctx=new C(); }
  if(ctx.state==='suspended') ctx.resume();
  return ctx;
}

/* ---- 音の部品 ---- */
function space(c,out,time,fb,wet){
  var d=c.createDelay(3); d.delayTime.value=time;
  var f=c.createGain(); f.gain.value=fb;
  var w=c.createGain(); w.gain.value=wet;
  d.connect(f); f.connect(d); d.connect(w); w.connect(out);
  return d;
}
function bell(c,dest,freq,when,vol,att,dec){
  [[0,1],[1200,.16]].forEach(function(p){
    var o=c.createOscillator(), g=c.createGain();
    o.type='sine'; o.frequency.value=freq*Math.pow(2,p[0]/1200);
    g.gain.setValueAtTime(0,when);
    g.gain.linearRampToValueAtTime(vol*p[1],when+att);
    g.gain.exponentialRampToValueAtTime(.0001,when+att+dec);
    o.connect(g); g.connect(dest); o.start(when); o.stop(when+att+dec+.1);
  });
}
function lfo(c,param,hz,depth){
  var o=c.createOscillator(), g=c.createGain();
  o.type='sine'; o.frequency.value=hz; g.gain.value=depth;
  o.connect(g); g.connect(param); o.start(); return o;
}

/* ---- 場面ごとのBGM ---- */
/* メニュー: 夜の虫と遠いパッド */
function sceneMenu(c,out){
  var oscs=[];
  [[174.61,.02],[261.63,.012]].forEach(function(p){
    var o=c.createOscillator(), g=c.createGain();
    o.type='sine'; o.frequency.value=p[0]; g.gain.value=p[1];
    oscs.push(lfo(c,g.gain,.05,p[1]*.35));
    o.connect(g); g.connect(out); o.start(); oscs.push(o);
  });
  var bus=c.createGain(); bus.gain.value=.75; bus.connect(out);
  function chirp(t,f){
    var n=4+Math.floor(Math.random()*3);
    for(var i=0;i<n;i++){
      var o=c.createOscillator(), g=c.createGain();
      o.type='sine'; o.frequency.value=f+Math.random()*200;
      var s=t+i*.032;
      g.gain.setValueAtTime(0,s); g.gain.linearRampToValueAtTime(.011,s+.006);
      g.gain.linearRampToValueAtTime(0,s+.024);
      o.connect(g); g.connect(bus); o.start(s); o.stop(s+.03);
    }
  }
  var n1=c.currentTime+.8, n2=c.currentTime+1.4;
  var iv=setInterval(function(){
    while(n1<c.currentTime+1.5){ chirp(n1,4100); n1+=1.1+Math.random()*.9; }
    while(n2<c.currentTime+1.5){ chirp(n2,3500); n2+=1.7+Math.random()*1.4; }
  },300);
  return {ivs:[iv],oscs:oscs};
}
/* L: ミニマル・パルス */
function sceneL(c,out){
  var bus=c.createGain(); bus.connect(out); bus.connect(space(c,out,.6,.35,.3));
  var lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1800; lp.Q.value=.5;
  lp.connect(bus);
  function tick(f,t,v){
    var o=c.createOscillator(), g=c.createGain();
    o.type='triangle'; o.frequency.value=f;
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.01);
    g.gain.exponentialRampToValueAtTime(.0001,t+.5);
    o.connect(g); g.connect(lp); o.start(t); o.stop(t+.55);
  }
  var t1=c.currentTime+.3, t2=c.currentTime+.3;
  var iv=setInterval(function(){
    while(t1<c.currentTime+1.6){ tick(349.23,t1,.04); t1+=.66; }
    while(t2<c.currentTime+1.6){ tick(523.25,t2,.022); t2+=.99; }
  },300);
  return {ivs:[iv],oscs:[]};
}
/* K: シンギングボウル */
function sceneK(c,out){
  var oscs=[];
  var dr=c.createOscillator(), dg=c.createGain();
  dr.type='sine'; dr.frequency.value=87.31; dg.gain.value=.015;
  oscs.push(lfo(c,dg.gain,.06,.006));
  dr.connect(dg); dg.connect(out); dr.start(); oscs.push(dr);
  var bus=c.createGain(); bus.connect(out); bus.connect(space(c,out,1.2,.4,.4));
  var nextT=c.currentTime+1;
  var iv=setInterval(function(){
    while(nextT<c.currentTime+3){
      var t=nextT, base=Math.random()<.5?174.61:220;
      [[1,.05],[2.71,.014],[5.42,.005]].forEach(function(p){
        var o=c.createOscillator(), g=c.createGain();
        o.type='sine'; o.frequency.value=base*p[0];
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(p[1],t+.04);
        g.gain.exponentialRampToValueAtTime(.0001,t+14);
        o.connect(g); g.connect(bus); o.start(t); o.stop(t+14.1);
      });
      nextT=t+14+Math.random()*8;
    }
  },900);
  return {ivs:[iv],oscs:oscs};
}
/* N: オルガン・パッド */
function sceneN(c,out){
  var lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1000; lp.Q.value=.4;
  lp.connect(out);
  var CH=[[174.61,220,261.63],[146.83,220,293.66],[130.81,196,261.63],[174.61,233.08,293.66]];
  var ci=0, nextT=c.currentTime+.2;
  var iv=setInterval(function(){
    while(nextT<c.currentTime+3){
      var t=nextT, chord=CH[ci%CH.length]; ci++;
      chord.forEach(function(f){
        [[1,.03],[2,.009]].forEach(function(p){
          var o=c.createOscillator(), g=c.createGain();
          o.type='sine'; o.frequency.value=f*p[0];
          g.gain.setValueAtTime(0,t);
          g.gain.linearRampToValueAtTime(p[1],t+2.5);
          g.gain.linearRampToValueAtTime(p[1]*.85,t+7);
          g.gain.linearRampToValueAtTime(.0001,t+10);
          o.connect(g); g.connect(lp); o.start(t); o.stop(t+10.1);
        });
      });
      nextT=t+8.5; /* 次の和音と1.5秒重ねてつなぎ目を消す */
    }
  },700);
  return {ivs:[iv],oscs:[]};
}
/* O: 風鈴 */
function sceneO(c,out){
  var bus=c.createGain(); bus.connect(out); bus.connect(space(c,out,.9,.4,.45));
  var HI=[1046.5,1174.66,1318.51,1567.98,1760];
  var t0=c.currentTime;
  var iv=setInterval(function(){
    var wind=Math.max(0,Math.sin((c.currentTime-t0)*.09));
    if(Math.random()<.06+wind*.4){
      var f=HI[Math.floor(Math.random()*HI.length)];
      bell(c,bus,f,c.currentTime+.05,.012+Math.random()*.022,.01,3);
    }
  },180);
  return {ivs:[iv],oscs:[]};
}
/* H: 静かなアルペジオ */
function sceneH(c,out){
  var bus=c.createGain(); bus.connect(out); bus.connect(space(c,out,.7,.3,.3));
  var lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1200; lp.Q.value=.5;
  lp.connect(bus);
  var SC=[174.61,196,220,261.63,293.66,349.23], SEQ=[0,2,4,3,5,3,2,1];
  var i=0, nextT=c.currentTime+.3;
  var iv=setInterval(function(){
    while(nextT<c.currentTime+2){
      var t=nextT;
      var o=c.createOscillator(), g=c.createGain();
      o.type='triangle'; o.frequency.value=SC[SEQ[i%SEQ.length]]; i++;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.06,t+.15);
      g.gain.exponentialRampToValueAtTime(.0001,t+2.6);
      o.connect(g); g.connect(lp); o.start(t); o.stop(t+2.7);
      nextT=t+1.15;
    }
  },300);
  return {ivs:[iv],oscs:[]};
}
var SCENES={menu:sceneMenu,l:sceneL,k:sceneK,n:sceneN,o:sceneO,h:sceneH};

/* ---- 再生の管理 ---- */
function stopCur(){
  if(!cur||!ctx) return;
  var h=cur; cur=null;
  var n=ctx.currentTime;
  h.out.gain.cancelScheduledValues(n);
  h.out.gain.setValueAtTime(h.out.gain.value,n);
  h.out.gain.linearRampToValueAtTime(0,n+.8);
  h.handle.ivs.forEach(clearInterval);
  setTimeout(function(){
    h.handle.oscs.forEach(function(o){ try{o.stop();}catch(e){} });
    try{ h.out.disconnect(); }catch(e){}
  },1000);
}
function play(name){
  if(!bgmOn) return;
  var c=ac(); if(!c) return;
  if(cur&&cur.name===name&&name==='menu') return; /* メニューは鳴り続ける */
  stopCur();
  var out=c.createGain(); out.gain.value=0; out.connect(c.destination);
  out.gain.linearRampToValueAtTime(name==='menu'?.24:.16, c.currentTime+1.2);
  cur={name:name,out:out,handle:SCENES[name](c,out)};
}
function nextGame(){
  var i=0; try{ i=parseInt(localStorage.getItem(IDX_KEY))||0; }catch(e){}
  var name=GAME_ROT[i%GAME_ROT.length];
  try{ localStorage.setItem(IDX_KEY,String((i+1)%GAME_ROT.length)); }catch(e){}
  return name;
}

/* ---- ミュートボタン(右下) ---- */
var btn=null;
function paint(){ if(btn){ btn.textContent=bgmOn?'♪':'♪̸'; btn.style.opacity=bgmOn?'.85':'.4';
  btn.setAttribute('aria-label',bgmOn?'BGMを止める':'BGMを鳴らす'); } }
function makeBtn(){
  if(window.MM_BGM_NO_BUTTON) return; /* 自前の音メニューを持つページはボタンを出さない */
  if(btn||!document.body) return;
  btn=document.createElement('button');
  btn.type='button';
  btn.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9999;width:40px;height:40px;'+
    'border-radius:50%;border:1px solid rgba(159,217,42,.35);background:rgba(12,18,6,.82);'+
    'color:#9FD92A;font-size:16px;line-height:1;cursor:pointer;padding:0;'+
    '-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)';
  btn.onclick=function(){
    bgmOn=!bgmOn; saveOn(); paint();
    if(!bgmOn) stopCur(); else play(cur?cur.name:'menu');
  };
  paint();
  document.body.appendChild(btn);
}

/* ---- 最初の操作で鳴らし始める(ブラウザは操作なしに音を出せない) ---- */
function boot(){
  if(started) return; started=true;
  play(cur?cur.name:'menu');
}
['pointerdown','keydown','touchstart'].forEach(function(ev){
  document.addEventListener(ev,boot,{once:true,passive:true});
});
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',makeBtn);
else makeBtn();

window.MMBGM={
  scene:function(kind){
    if(kind==='off'){ stopCur(); return; }
    if(kind==='game'){ started=true; play(nextGame()); return; }
    started=true; play('menu');
  },
  isOn:function(){ return bgmOn; },
  /* ページ側の音メニューからON/OFFするためのAPI(タイピングマスターが使う) */
  setOn:function(v){
    v=!!v;
    if(v===bgmOn){ paint(); return; }
    bgmOn=v; saveOn(); paint();
    if(!bgmOn) stopCur();
    else play(cur?cur.name:'menu');
  }
};
})();
