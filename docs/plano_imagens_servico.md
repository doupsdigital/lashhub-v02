# Plano: Imagens de Serviço no Portal da Cliente

**Status:** Aguardando aprovação  
**Reversível:** Sim (ver seção "Como reverter")

---

## Objetivo

Permitir que a profissional adicione uma foto ilustrativa em cada serviço. A imagem aparece no card do serviço no portal da cliente, acima do botão "Agendar", tornando o catálogo mais visual e atrativo.

---

## O que muda (e o que NÃO muda)

| | |
|---|---|
| ✅ Profissional pode (opcionalmente) adicionar imagem a cada serviço | |
| ✅ Portal exibe a imagem se ela existir | |
| ✅ Se não tiver imagem, o card continua igual ao atual (sem imagem) | |
| ❌ Nenhum serviço existente é afetado | |
| ❌ Nenhum fluxo de agendamento muda | |

A funcionalidade é **100% aditiva** — nada do que existe hoje é removido ou alterado.

---

## Arquivos envolvidos

### Novos
- `src/utils/imageCompression.ts` — função utilitária de compressão (usada também para corrigir o upload da logo)

### Modificados
- `src/types/index.ts` — adicionar `imagem_url` na interface `Servico`
- `src/pages/profissional/Servicos.tsx` — UI de upload no modal de criação/edição de serviço
- `src/pages/portal-clientes/PortalCatalogo.tsx` — exibir imagem no card do serviço

### Banco de dados (Supabase)
- Tabela `servicos`: adicionar coluna `imagem_url TEXT NULL`
- Storage: criar bucket `servicos-imagens` com acesso público de leitura

---

## Detalhamento por etapa

### Etapa 1 — Banco de dados
Executar no Supabase SQL Editor:
```sql
ALTER TABLE servicos ADD COLUMN imagem_url TEXT NULL;
```
Nenhuma linha existente é afetada (a coluna começa como NULL em tudo).

### Etapa 2 — Bucket de storage
Criar bucket `servicos-imagens` no Supabase Storage:
- Acesso: público (leitura sem autenticação, para o portal da cliente poder exibir)
- Estrutura de path: `{estabelecimento_id}/{servico_id}-{timestamp}.jpg`

### Etapa 3 — Função de compressão (`imageCompression.ts`)
Função pura sem dependências externas, usando Canvas API nativa do browser:

**Comportamento garantido independente do que a profissional enviar:**
- Redimensiona para máximo 800×800px (mantendo proporção)
- Converte para JPEG, qualidade 80%
- Resultado: sempre entre 60–200 KB

```typescript
// Assinatura da função
compressImage(file: File, maxDimension?: number, quality?: number): Promise<File>
```

### Etapa 4 — Upload + Preview em tempo real no Servicos.tsx

O modal de criação/edição de serviço ganha dois painéis lado a lado (empilhados no mobile):

**Painel esquerdo — formulário (igual ao atual + campo de imagem):**
- Área clicável de upload com preview em miniatura da imagem selecionada
- Ao selecionar arquivo → comprime automaticamente → exibe no preview
- Upload para o Supabase só acontece ao salvar o serviço
- Botão de remover imagem
- Estado de loading durante upload
- Campo completamente opcional

**Painel direito — preview do card do portal (novo):**
- Título: "Como vai aparecer no portal"
- Renderiza um card idêntico ao do portal da cliente, usando os dados digitados no formulário em tempo real
- Dois estados visuais:

```
SEM imagem                    COM imagem
┌──────────────────┐          ┌──────────────────┐
│                  │          │  ┌──────────────┐ │
│ Nome do Serviço  │          │  │  [foto aqui] │ │
│ Descrição...     │          │  └──────────────┘ │
│ ⏱ 2h  🏷 R$150  │          │ Nome do Serviço   │
│ [ Agendar ]      │          │ Descrição...      │
└──────────────────┘          │ ⏱ 2h  🏷 R$150   │
                              │ [ Agendar ]       │
Legenda:                      └──────────────────┘
"Sem foto — o card
aparece assim"                Legenda:
                              "Com foto"
```

A profissional vê o resultado final antes de salvar, sem precisar abrir o portal.

### Etapa 5 — Exibição no PortalCatalogo.tsx
No componente `ServicoCard`, adicionar acima do nome do serviço:

```
┌─────────────────────────────┐
│  [imagem 16:9 rounded-t-2xl] │  ← só aparece se imagem_url existir
│                              │
├─────────────────────────────┤
│  Nome do Serviço             │
│  Descrição...                │
│  ⏱ 2h   🏷 R$ 150,00        │
│  [ Agendar ]                 │
└─────────────────────────────┘
```

Se `imagem_url` for null, o card renderiza exatamente como hoje.

---

## Compressão: garantia de tamanho

| Foto recebida | Resultado após compressão |
|---|---|
| Foto celular 4 MB | ~100–150 KB |
| Print 2 MB | ~80–120 KB |
| Imagem 4K 8 MB | ~150–200 KB |
| Imagem já pequena 50 KB | ~40–50 KB (não piora) |

**Estimativa de storage com 100 profissionais:**
- Média 150 KB por imagem × 20 serviços por profissional × 100 profissionais = **300 MB**
- Supabase free: 1 GB de storage → cabe com folga
- Supabase Pro: $0,021/GB extra → custo adicional desprezível

---

## Como reverter (rollback completo)

Para voltar ao estado atual sem imagens, basta:

1. **Frontend** — reverter os commits que tocam em:
   - `src/utils/imageCompression.ts` (deletar arquivo)
   - `src/pages/profissional/Servicos.tsx` (remover bloco de upload)
   - `src/pages/portal-clientes/PortalCatalogo.tsx` (remover bloco da imagem no card)
   - `src/types/index.ts` (remover campo `imagem_url`)

2. **Banco** — a coluna `imagem_url` pode ficar (não causa problema) ou ser removida:
   ```sql
   ALTER TABLE servicos DROP COLUMN imagem_url;
   ```

3. **Storage** — esvaziar e deletar o bucket `servicos-imagens` no painel do Supabase

O portal da cliente volta ao visual atual automaticamente após o deploy do frontend revertido.

---

## Rollback do preview (se removida a funcionalidade)

O componente de preview é isolado dentro do modal. Para removê-lo basta apagar o painel direito do modal — os estados do formulário (nome, valor, duração) continuam intactos pois são compartilhados, não criados pelo preview.

---

## O que NÃO está no escopo deste plano

- Múltiplas imagens por serviço (galeria) — possível expansão futura
- Imagem por variação de serviço — possível expansão futura
- Compressão/correção do upload da logo existente — pode ser feito junto, mas é opcional
