/* Chamadas à API da Google através da Edge Function "google-proxy" do Supabase.
   A chave da Google NUNCA está aqui: fica guardada como segredo no Supabase.

   Uso:
     googleAI("Escreve uma frase motivacional.").then(function(texto){ ... });
     googleGeocode("Palmela, Portugal").then(function(dados){ ... });
*/
(function(){
var FN="google-proxy";

function call(body){
  var sb=window.ATEC_SB;
  if(!sb||!sb.functions)return Promise.reject(new Error("Supabase não está disponível."));
  return sb.functions.invoke(FN,{body:body}).then(function(r){
    if(r.error)throw r.error;
    return r.data;
  });
}

/* Gemini: devolve o texto da resposta */
window.googleAI=function(prompt){
  return call({service:"gemini",prompt:prompt}).then(function(d){return d.text});
};

/* Geocoding: devolve a resposta completa da Google (results[0].geometry.location, etc.) */
window.googleGeocode=function(address){
  return call({service:"geocode",address:address});
};
})();
