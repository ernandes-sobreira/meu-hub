/* Teste automatizado de isolamento, para Firebase Emulator Suite.
   npm install --save-dev @firebase/rules-unit-testing firebase
   firebase emulators:exec --only firestore "node firestore.test.cjs"
   Importante: os IDs abaixo são fixtures sintéticas, não dados de coautores reais. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,collection,getDoc,getDocs,setDoc,updateDoc}=require('firebase/firestore');
(async()=>{
const env=await initializeTestEnvironment({projectId:'aginov-security-test',firestore:{rules:fs.readFileSync('firestore.rules','utf8')}});
try{
  const tokA='a'.repeat(64),tokB='b'.repeat(64);
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    await setDoc(doc(db,'convites',tokA),{pessoaId:'personA'});
    await setDoc(doc(db,'convites',tokB),{pessoaId:'personB'});
    for (const id of ['personA','personB']) await setDoc(doc(db,'pessoas',id),{
      nome:id,email:'',cpf:'',vinculo:'',telefone:'',inpi:'nao-sei',obs:'',status:'pendente',participacoes:[]
    });
    await setDoc(doc(db,'softwares','softwareA'),{titulo:'TESTE',autores:[{pessoaId:'personA',percentual:100}]});
  });
  const alice=env.authenticatedContext('uid_A',{firebase:{sign_in_provider:'anonymous'}}).firestore();
  await assertSucceeds(getDoc(doc(alice,'convites',tokA)));
  await assertSucceeds(setDoc(doc(alice,'acessos','uid_A'),{pessoaId:'personA',token:tokA}));
  await assertSucceeds(getDoc(doc(alice,'pessoas','personA')));
  await assertFails(getDoc(doc(alice,'pessoas','personB')));
  await assertFails(getDocs(collection(alice,'pessoas')));
  await assertFails(getDocs(collection(alice,'softwares')));
  await assertFails(getDocs(collection(alice,'convites')));
  await assertFails(getDoc(doc(alice,'softwares','softwareA')));
  await assertFails(updateDoc(doc(alice,'pessoas','personA'),{percentual:77}));
  await assertFails(updateDoc(doc(alice,'pessoas','personA'),{status:'assinado'}));
  await assertFails(setDoc(doc(alice,'acessos','uid_B'),{pessoaId:'personB',token:tokB}));
  await assertFails(setDoc(doc(alice,'acessos','uid_A'),{pessoaId:'personB',token:tokB}));
  const bob=env.authenticatedContext('uid_B',{firebase:{sign_in_provider:'anonymous'}}).firestore();
  await assertSucceeds(getDoc(doc(bob,'convites',tokB)));
  await assertSucceeds(setDoc(doc(bob,'acessos','uid_B'),{pessoaId:'personB',token:tokB}));
  await assertFails(getDoc(doc(bob,'pessoas','personA')));
  const fakeAdmin=env.authenticatedContext('fake_admin',{email:'ernandes@unemat.br',email_verified:true,firebase:{sign_in_provider:'password'}}).firestore();
  await assertFails(getDocs(collection(fakeAdmin,'pessoas')));
  console.log('PASSOU: token A não lê B, token B não lê A, coleções não são listáveis e percentuais/status protegidos.');
}finally{await env.cleanup();}
})().catch(e=>{console.error(e);process.exitCode=1;});