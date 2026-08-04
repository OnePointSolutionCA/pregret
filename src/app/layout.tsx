import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pregret.ca";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Pregret — Know Before You Regret",
    template: "%s | Pregret",
  },
  description:
    "See the Regret Score for any product before you buy. Crowdsourced satisfaction data at 30, 60, and 90 days — the truth about what owners actually think.",
  openGraph: {
    type: "website",
    siteName: "Pregret",
    url: site,
    title: "Pregret — Know Before You Regret",
    description: "Time-decayed satisfaction data on the products you're about to buy. Free. No BS reviews.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pregret — Know Before You Regret",
    description: "Time-decayed satisfaction data on the products you're about to buy.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jakarta.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="rd flex min-h-full flex-col" data-rd>
          <span className="rd-progress" data-progress />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var root=document.querySelector('[data-rd]'); if(!root) return;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=matchMedia('(pointer: fine)').matches;
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  var hero=document.querySelector('.rd-hero');
  requestAnimationFrame(function(){requestAnimationFrame(function(){if(hero)hero.classList.add('is-ready');});});
  setTimeout(function(){if(hero)hero.classList.add('is-ready');},500);
  var bar=document.querySelector('[data-progress]');
  function onScroll(){var h=document.documentElement,max=h.scrollHeight-h.clientHeight;var p=max>0?(h.scrollTop||document.body.scrollTop)/max:0;if(bar)bar.style.width=(p*100)+'%';}
  addEventListener('scroll',onScroll,{passive:true}); onScroll();
  var sel='[data-rr],[data-rr-l],[data-rr-r]';
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll(sel).forEach(function(el){io.observe(el);});
  } else document.querySelectorAll(sel).forEach(function(el){el.classList.add('is-in');});
  if('IntersectionObserver' in window && !reduce){
    var co=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return; var el=e.target,target=parseInt(el.getAttribute('data-count'),10)||0,suf=el.getAttribute('data-suffix')||'',t0=null,dur=1400;
      function step(ts){if(t0===null)t0=ts;var p=Math.min((ts-t0)/dur,1),eased=1-Math.pow(1-p,3);el.textContent=Math.round(target*eased)+suf;if(p<1)requestAnimationFrame(step);}
      requestAnimationFrame(step); co.unobserve(el);
    });},{threshold:.5});
    document.querySelectorAll('[data-count]').forEach(function(el){co.observe(el);});
  }
  if('IntersectionObserver' in window){
    var lo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-lit');setTimeout(function(){e.target.classList.remove('is-lit');},1200);lo.unobserve(e.target);}});},{threshold:.9});
    document.querySelectorAll('[data-outline]').forEach(function(el){lo.observe(el);});
  }
  if(!reduce){
    var tracks=[];
    document.querySelectorAll('.rd-marquee').forEach(function(mq){
      var track=mq.querySelector('.rd-marquee__track'); if(!track)return; mq.classList.add('-js');
      var st={track:track,dir:parseFloat(track.getAttribute('data-marq'))||1,pos:0,setW:track.scrollWidth/3,extra:0,hover:false};
      mq.addEventListener('mouseenter',function(){st.hover=true;}); mq.addEventListener('mouseleave',function(){st.hover=false;});
      tracks.push(st);
    });
    if(tracks.length){
      (function frame(){tracks.forEach(function(st){if(!st.setW)st.setW=st.track.scrollWidth/3||1;var base=st.hover?0.06:0.5;st.pos-=(base+st.extra)*st.dir;var w=st.setW;st.pos=st.pos%w;if(st.pos>0)st.pos-=w;st.track.style.transform='translateX('+st.pos+'px)';st.extra*=0.9;});requestAnimationFrame(frame);})();
      var lastY=pageYOffset;
      addEventListener('scroll',function(){var y=pageYOffset,vel=Math.min(Math.abs(y-lastY),90);lastY=y;tracks.forEach(function(st){st.extra+=vel*0.22;});},{passive:true});
    }
  }
  if(!fine||reduce) return;
  var mag=[];
  document.querySelectorAll('[data-magnetic]').forEach(function(el){
    var m={el:el,tx:0,ty:0,cx:0,cy:0,rect:null};
    el.addEventListener('mouseenter',function(){m.rect=el.getBoundingClientRect();});
    el.addEventListener('mousemove',function(ev){m.rect=m.rect||el.getBoundingClientRect();m.tx=(ev.clientX-m.rect.left-m.rect.width/2)*0.3;m.ty=(ev.clientY-m.rect.top-m.rect.height/2)*0.4;});
    el.addEventListener('mouseleave',function(){m.rect=null;m.tx=0;m.ty=0;});
    mag.push(m);
  });
  if(mag.length)(function loop(){for(var i=0;i<mag.length;i++){var m=mag[i];m.cx+=(m.tx-m.cx)*0.18;m.cy+=(m.ty-m.cy)*0.18;if(m.tx===0&&m.ty===0&&Math.abs(m.cx)<0.03&&Math.abs(m.cy)<0.03){if(m.el.style.transform)m.el.style.transform='';m.cx=0;m.cy=0;}else m.el.style.transform='translate('+m.cx.toFixed(2)+'px,'+m.cy.toFixed(2)+'px)';}requestAnimationFrame(loop);})();
})();`,
          }}
        />
      </body>
    </html>
  );
}
