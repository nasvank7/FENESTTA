var a='nasvan'
var b=a.split('')
console.log(b);
// console.log(b);
// let c=0

for(let i=0;i<b.length;i++){
     let c=0
  for(let j=0;j<b.length;j++){
    if(i!=j)
{if(b[i]==b[j]){
   c++
}
 }

  }
  if(c==0){
    console.log(b[i]);
  }
}
  

// console.log(count);
