const numberOfPoints = 80;
const totalPoints = numberOfPoints;
const innerR = 180;
const outerR =250;
const margin = {top: 74, left:74};
const marginleft = margin.left;
const margintop = margin.top;
const lineLength =  2 * innerR * Math.PI;
const lineDivision = lineLength/totalPoints;
const cx = 254;
const cy = 254;
const dur = 500/numberOfPoints;
let playlistShow = false;
const progressLineLength = 447;

let audio = new Audio('media/chopin-mazurka-in-d-major-b4.mp3');
const playPause = $('#play-pause');
const next = $('#next');
const prev = $('#prev');
const playlist = $('#playlist_icon');
const song = $('#playlist-container .song');
const svg = $('svg');

const circleInnerStates = [];
const circleOuterStates = [];

function createState(radius, circleStates, percent, padding) {
  for (i=0; i<totalPoints; i++){
    //circle portion
    var circleState = $.map(Array(numberOfPoints), function (d, j) {
      var x = -padding+marginleft + radius + lineDivision*i + radius * Math.sin(2 * j * Math.PI * percent / (numberOfPoints - 1));
      var y = -padding+ margintop + radius - radius * Math.cos(2 * j * Math.PI * percent / (numberOfPoints - 1));
      return { x: x, y: y};
    })
    circleState.splice(numberOfPoints-i);
    //line portion
    const lineState = $.map(Array(numberOfPoints), function (d, j) {
      const x =-padding + marginleft + radius + lineDivision*j;
      const y = -padding + margintop;
      return { x: x, y: y};
    })
    lineState.splice(i);
    //together
    var individualState = lineState.concat(circleState);
    circleStates.push(individualState);
  }
}

function createLineData(padding) {
  const lineData = $.map(Array(numberOfPoints), function (d, i) {
    const y = -padding + margin.top;
    const x = -padding + margin.left + i * lineLength / (numberOfPoints - 1)
    return {x: x, y: y}
  });
}

function progressAsLine(progress){
  progressLine.transition()
    .duration(10)
    .attr('width', progress)
}

function endall(transition, callback) {
  if (typeof callback !== "function") throw new Error("Wrong callback in endall");
  if (transition.size() === 0) {
    callback()
  }
  let n = 0;
  transition
    .each(function() { ++n; })
    .each("end", function() {
      if (!--n) callback.apply(this, arguments);
    });
}

function toggleClasses () {
  $('#progressCircle').toggleClass('hide');
  $('#progressLine').toggleClass('hide');
  $('#playlist-container').toggleClass('hide');
  $('.controls .control').toggleClass('hide');
  $('#current-song').toggleClass('hide');
}

function unroll() {
  toggleClasses();
  for(let i=0; i<numberOfPoints; i++){
    circleInner.data([circleInnerStates[i]])
      .transition()
      .delay(dur*i)
      .duration(dur)
      .ease("linear")
      .attr('d', pathFunction)

    circleOuter.data([circleOuterStates[i]])
      .transition()
      .delay(dur*i)
      .duration(dur)
      .ease("linear")
      .attr('d', pathFunction)

  }
  svgContainer.classed("slide-left", !svgContainer.classed("slide-left"));
  svgContainer.classed("slide-right", !svgContainer.classed("slide-right"));
}

function roll() {
  for(let i=0; i<numberOfPoints; i++){
    circleInner.data([circleInnerStates[numberOfPoints-1-i]])
      .transition()
      .delay(dur*i)
      .duration(dur)
      .ease("linear")
      .attr('d', pathFunction)
    circleOuter.data([circleOuterStates[numberOfPoints-1-i]])
      .transition()
      .delay(dur*i)
      .duration(dur)
      .ease("linear")
      .attr('d', pathFunction)
    if(i == numberOfPoints-1){
      d3.selectAll("g").transition().call(endall, function() {
       toggleClasses();
      });
    }
  }
  svgContainer.classed("slide-left", !svgContainer.classed("slide-left"));
  svgContainer.classed("slide-right", !svgContainer.classed("slide-right"));
}

function isPlaying(audelem) {
  if(audelem.currentTime > 0 && !audelem.paused && !audelem.ended){
    return true;
  }
  return false;
}

function setSong(el) {
  const song = el.attr('song');
  const cover = el.attr('cover');
  const artist = el.attr('artist');

  $('#playlist-container .song.active').removeClass('active');
  el.addClass('active');

  $('#current-song .name').text(song);
  $('#current-song .artist').text(artist);
  $('#bg-image').css('background',
    'url(images/' +  cover + ') no-repeat center center fixed'  );
  audio = new Audio('media/' + song);
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radius, startAngle, endAngle){

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");

  return d;
}

function updateProgress(percent, r) {
  $('#progressCircle').attr('d',describeArc(cx, cy, r, 0, 360 * (percent/100)))
}

function calculateDuration() {
  $(audio).bind( "timeupdate", () => {
    let s = parseInt( audio.currentTime % 60);
    let m = parseInt( audio.currentTime / 60) % 60;

    if( s < 10 ) {
      s = '0' + s;
    }
    if( m < 10 ) {
      m = '0' + m;
    }
    $('#current-song .time').html( m + ':' + s);
    let value = 0.1;
    if (audio.currentTime > 0) {
      value = Math.floor((100 / audio.duration) * audio.currentTime);
    }
    if (playlistShow) {
      progressAsLine( progressLineLength * (value / 100));
    } else {
      updateProgress( value, outerR );
    }
  });

  $(audio).bind('ended', () => {
    playNext();
  });

}

function play() {
  audio.play();
  calculateDuration();
  $(".play-icon").addClass("pause");
}

function stop() {
  audio.pause();
  $(".play-icon").removeClass("pause");
}

function playNext() {
  stop();
  const nextSong = $('#playlist-container .song.active').next();
  if (nextSong.length > 0) {
    setSong(nextSong);
  } else {
    setSong($('#playlist-container .song:first-child'));
  }
  play();
}

createState(innerR, circleInnerStates, 1, 0);
createState(outerR,circleOuterStates, 1, 70);
createLineData(0);
createLineData(70);

const pathFunction = d3.svg.line()
  .x(function (d) {return d.x;})
  .y(function (d) {return d.y;})
  .interpolate("basis");

var svgContainer = d3.select("svg")

const circleInner = svgContainer.append("g")
  .append("path")
  .data([circleInnerStates[0]])
  .attr("d", pathFunction)
  .attr("class", "circle");

const circleOuter = svgContainer.append("g")
  .append("path")
  .data([circleOuterStates[0]])
  .attr("d", pathFunction)
  .attr("class", "circle");

const progressLine = svgContainer.append('rect')
  .attr('height', 4)
  .attr('width', 0)
  .attr('fill', 'white')
  .attr('x', cx)
  .attr('y', cy - outerR)
  .attr('id', 'progressLine')
  .attr('class', 'hide');

setSong($('#playlist-container .song:first-child'));

playlist.on('click', () => {
  $('#playlist_icon').toggleClass('open');
  if (!playlistShow) {
    playlistShow = true;
    unroll();
  } else {
    playlistShow = false;
    roll();
  }
})

playPause.on( 'click', () => {
  if(isPlaying(audio)){
    stop();
  }else{
    play();
  }
});

next.on( 'click', () => {
  playNext();
});

prev.on( 'click', () => {
  stop();
  const prevSong = $('#playlist-container .song.active').prev();
  if (prevSong.length > 0) {
    setSong(prevSong);
  } else {
    setSong($('#playlist-container .song:last-child'));
  }
  play();

})

song.on( 'click', (e) => {
  event.stopPropagation();
  stop();
  let selectedSong;

  if(e.target.nodeName != 'LI') {
    selectedSong = e.target.parentElement;
  }else {
    selectedSong = e.target;
  }
  setSong($(selectedSong));
  play();
})
