/* Kytric Voxel Board Games, CC0. Original glTF mesh positions quantized to
 * 0.01 source unit, coincident vertices deduplicated; triangle topology retained.
 * No textures or external model downloads. See assets/game/3d/NOTICE.txt. */
(function(g){
'use strict';
const packed={
 dice:{v:'RFioRE5ORE6yRFiURFhsRFhYRGyoRGyURGxsRGxYRHaKRHZ2RIqKRIp2RJSoRJSURJRsRJRYRKioRKiURKhsRKhYRLKyRLJOTk6yTkROTkSyTk5OTrK8Tk68TrKyTrJOTk5ETrJETryyTrxOskSyskROsk6ysk5Osk68srK8srKysk5EsrJOsrJEsryysrxOvE6yvE5OvFhsvFhYvGxsvGxYvHaKvHZ2vIqKvIp2vJSovJSUvKiovKiUvLKyvLJOWJS8WKi8bJS8bKi8lFi8lGy8qFi8qGy8WFhEWGxEWJREWKhEbFhEbGxEbJREbKhElFhElGxElJRElKhEqFhEqGxEqJREqKhEWESobESodkSoikSolESoqESoWESUbESUdkSUikSUlESUqESUWERsbERsdkRsikRslERsqERsWERYbERYdkRYikRYlERYqERYdryKiryKdrx2irx2',
 f:'AAECAwEABAEDBQEEBgACBgMABwQDBwMGCAUECAQHCQEFCQUICggHCgcGCgkICwkKDAoGDAsKDQkLDQsMDgYCDgwGDg0MDw0OEAkNEA0PEQEJEQkQEg8OEg4CExAPEw8SFBEQFBATFQERFREUFhICFhQTFhUUFhMSFwEVFxUWGBkaGxkYHBgdHhgcHyAbISAfIh8eIx8iJCUmJiUnKCYpKSYqJyssLCstKiwuLiwvMDEyMjEzMDI0MjM0MzE1NDM1MDQ2NDU2NjU3MDY4Njc4NzU5ODc5MDg6ODk6Ojk7MDo8Ojs8Ozk9PDs9MDw+PD0+NTE/Pj0/OTU/PTk/QBwdQRxAQkAdQkFAQxxBQ0FCREIdRENCRUNERkQdRkVER0NFR0VGKEYdKEdGKRxDKUcoKUNHGBYCHhYYJBgaJhgkKiIeLiIqMComPiowARcbGxcfGRslJRsnHyMsLCMvJywxMSw/ICFISCFJSSFKSiFLIEhMSElMSUpNTElNSktOTUpOSyFPTktPTU5QTE1QTk9QIExQUE9RUU9STyFTUk9TIFBUUFFUUVJVVFFVUlNWVVJWUyFXVlNXIFQrVVYrVlcrVFUrVyEtK1ctWCQaWSRYWiRZWyRaXCRbXSRcXlgaXllYX1pZX1leYFtaYFpfYVxbYVtgYl1cYlxhYyRdY11iZGJhZGFgZGNiZGBfZF9eZF4aZWNkZmNlZ2NmaGNnaSRjaWNoamQaamVka2Zla2VqbGdmbGZrbWhnbWdsbmlobmhtbyRpb2luGWxrGW5tGW9uGWtqGWoaGW1sJSRvJW8ZGCgdJigYARgCGxgBJzAmMTAnICcbKycgHCkeHikqFh4XFx4fKj4sLD4/HywhISwtIi5wcC5xInBycHFycS5zcnFzInIjcnMjcy4vI3Mv',
 p:'oAkKkAkAAKBQKIBCAQAAaAJoAoBmAoBmAgAAoAA='},
 pawn:{v:'WE6oWDBYWDCoWE5YYmyeYlhiYlieYmxiYsaeYpRiYpSeYsZibFiUbE5sbE6UbFhsbJSUbGxsbGyUbJRsbNCUbMZsbMaUbNBslE6UlE5slFiUlFhslGyUlGxslJSUlJRslMaUlMZslNCUlNBsnlienlhinmyenmxinpSenpRinsaensZiqDCoqDBYqE6oqE5Y',
 f:'AAECAwEABAUGBwUECAkKCwkIDA0ODw0MEBESExEQFBUWFxUUGBkaGhkbHB0eHh0fICEiIiEjJCUmJiUnKCkqKikrLC0uLi0vLAACLgAsJAQGJgQkKAgKKggoGAwOGgwYHBASHhAcIBQWIhQgDQ8ZGQ8bERMdHRMfFRchIRcjBQclJQcnCQspKQsrAQMtLQMvASwCLSwBDCQGGiQMDwwGGyQaBQ8GBRsPJSQbJRsFECgKHigQExAKHygeCRMKCR8TKSgfKR8JAC4ODi4YAA4NGC4ZAA0DDRkDGS4vAxkvBCYSEiYcBBIRHCYdBBEHER0HHSYnBx0nCCoWFiogCBYVICohCBULFSELISorCyErFCIXFyIj',
 p:'AAAAAAAAAAAAAAAA'}
};
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
function decode(raw){const v=bytes(raw.v),f=bytes(raw.f),p=bytes(raw.p);const vertices=[];for(let i=0;i<v.length;i+=3)vertices.push([(v[i]-128)/100,(v[i+1]-128)/100,(v[i+2]-128)/100]);const faces=[];for(let i=0;i<f.length;i+=3)faces.push({indices:[f[i],f[i+1],f[i+2]],pip:!!(p[(i/3)>>3]&(1<<((i/3)&7)))});return {vertices,faces};}
g.RLAModelMeshes=Object.freeze({dice:decode(packed.dice),pawn:decode(packed.pawn)});
})(typeof window!=='undefined'?window:globalThis);
