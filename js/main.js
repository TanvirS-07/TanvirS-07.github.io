// logo strip, icons from simple icons
const slugs = ['typescript','react','nextdotjs','nodedotjs','python','go','postgresql','docker','kubernetes','terraform','githubactions','linux','tailwindcss','git'];
const track = document.getElementById('track');
const make = () => slugs.map(s => `<span role="img" aria-label="${s}" style="--i:url(https://cdn.simpleicons.org/${s})"></span>`).join('');
track.innerHTML = make() + `<div style="display:contents" aria-hidden="true">${make()}</div>`;
