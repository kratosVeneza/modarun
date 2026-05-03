
# Notificações no sininho

Nesta versão o sininho aparece também no mobile. As notificações sociais são geradas para:

- novo seguidor;
- nova mensagem privada;
- curtida em publicação;
- comentário em publicação;
- resposta a comentário.

Se a tabela `notificacoes` ainda não estiver no Realtime, rode:

```sql
alter publication supabase_realtime add table notificacoes;
```

Se o Supabase informar que a tabela já faz parte da publicação, ignore o aviso.
