# AGINOV · Coautores de software — implantação

## Arquivos
- `index.html`: aplicação, hospedar no GitHub Pages (somente este arquivo é público).
- `firestore.rules`: regras de segurança. Publicar no Firebase Console em Firestore > Regras, ou pela CLI.
- `firestore.test.cjs`: testes de segurança contra o emulador. **Não colocar no GitHub Pages como componente do app**.

## Configuração Firebase
1. Abra https://console.firebase.google.com/ e crie um projeto. Na seção **Build > Firestore Database**, crie o banco. Escolha o local com atenção e use regras restritivas desde o início (não publicar regras de teste em produção).
2. Em **Authentication > Sign-in method**, ative **Anonymous** e **Google**. Configure o e-mail de suporte solicitado pelo Firebase.
3. Em **Authentication > Settings > Authorized domains**, adicione `ernandes-sobreira.github.io` (sem `https://` e sem caminho).
4. Em **Project settings > Your apps**, registre um app web. Copie `firebaseConfig` (objeto com `apiKey`, `authDomain`, `projectId`, `appId` e outros campos).
5. Em **Firestore > Rules**, cole `firestore.rules` integralmente e publique. **Não deixe `allow read, write: if true`**.
6. Coloque `index.html` no diretório publicado do repositório GitHub Pages e abra a URL. Cole a configuração Firebase no formulário inicial e clique **Conectar**. A configuração fica em `localStorage` no navegador, não expõe senha do Firebase. Para outro dispositivo, cole novamente.
7. Clique **Entrar com Google** usando `ernandes@unemat.br`. Outra conta não terá acesso de administrador.
8. Na opção **Importar JSON**, selecione seu arquivo exportado de esquema `aginov-autoria-56-v2`, que contém 56 itens em `programs` e `profiles`. Os dados vão diretamente do navegador autenticado ao Firestore. **Não adicione esse JSON ao repositório público**, pois contém dados pessoais.
9. No painel, revise homônimos, nomes variantes, e percentuais em branco; confira se todos os 56 softwares foram associados às pessoas corretas. Importação usa identidade normalizada pelo nome. Renomear um coautor no painel não renomeia o seu ID.
10. Clique **Copiar e-mail** para preparar o texto e o link único a compartilhar por canal privado. Pessoas sem e-mail ficam pendentes; os filhos do responsável são preenchidos no painel (sem convites por padrão).
11. Só após verificar o modelo oficial mais recente do Anexo I, os dados completos e a assinatura de cada criador, utilize os DOCX/PDF. A geração atual usa **minuta estruturada**, não foi validada como reproduzindo fielmente o Anexo I oficial. Botão **Baixar todos** produz ZIP dos softwares com todos os perfis preenchidos.

## Segurança e limitações
- Coleções `pessoas`, `softwares`, `convites` não são listáveis por visitantes. Convidados anônimos podem `get` apenas por identificadores que conheçam e acessar sua própria ficha após demonstrar posse de token com 64 caracteres hexadecimais.
- `convites/{token}` tem somente `pessoaId` e nenhum dado pessoal. O vínculo `acessos/{uid}` é imutável pelos convidados após a criação.
- A lista dos programas e percentuais que a pessoa vê é uma cópia resumida em seu próprio documento, feita na importação ou após editar autoria no painel.
- Nunca divulgar URLs com token em grupo público ou serviços de analytics; o link é uma credencial do tipo *bearer*. A autenticação anônima é local ao navegador. O sistema **não possui revogação imediata** do vínculo já criado; para revogação efetiva, implemente procedimento administrativo que remova `acessos` vinculados além do convite.
- O CPF é mascarado na interface do próprio coautor depois de salvo, mas continua no Firestore e é legível por ele próprio com seu token. Isso é necessário para permitir correções e não equivale a criptografia de campo. O administrador pode exportar dados completos, incluindo CPF; trate os arquivos exportados como sigilosos.
- A validação matemática do CPF ocorre no navegador; as regras verificam formato, não os dígitos verificadores. Para validação de CPF à prova de cliente adulterado, use um backend (Cloud Functions) para a gravação ou regras mais completas, com testes.
- O status `assinado` é definido manualmente pelo administrador, não significa que o sistema verificou assinatura gov.br. Os documentos são gerados no cliente usando CDN de terceiros (docx.js, jsPDF, JSZip); para dados sensíveis, considere hospedar as bibliotecas localmente com versões fixas e auditoria de dependências.
- A conta Google institucional só obtém privilégio admin se o token tiver e-mail verificado `ernandes@unemat.br` e provedor Google; verifique também a titularidade e políticas da conta.

## Teste de regras
Instale Node.js, Firebase CLI e as dependências num diretório local:

```bash
npm init -y
npm install --save-dev @firebase/rules-unit-testing firebase
npm install -g firebase-tools
```

Crie `firebase.json` no mesmo diretório:

```json
{"firestore":{"rules":"firestore.rules"},"emulators":{"firestore":{"port":8080}}}
```

Execute:

```bash
firebase emulators:exec --project aginov-security-test --only firestore "node firestore.test.cjs"
```

Os testes provam, para fixtures sintéticas A e B, que A não lê B, não lista coleções, não altera percentuais, não cria vínculo para outra UID e não se promove a assinado. O teste exige executar, não é prova de auditoria externa concluída.