export type VisaoAgenda = "dia" | "semana" | "mes";

export function hojeLocal() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function somarDias(data: string, dias: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const valor = new Date(Date.UTC(ano, mes - 1, dia));
  valor.setUTCDate(valor.getUTCDate() + dias);
  return valor.toISOString().slice(0, 10);
}

export function inicioSemana(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const deslocamento = (new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay() + 6) % 7;
  return somarDias(data, -deslocamento);
}

export function gradeMes(data: string) {
  const inicio = `${data.slice(0, 7)}-01`;
  const [ano, mes, dia] = inicio.split("-").map(Number);
  const deslocamento = (new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay() + 6) % 7;
  const comeco = somarDias(inicio, -deslocamento);
  return Array.from({ length: 42 }, (_, indice) => somarDias(comeco, indice));
}

export function intervaloConsulta(visao: VisaoAgenda, data: string) {
  if (visao === "dia") return { inicio: data, fim: somarDias(data, 1) };
  if (visao === "semana") {
    const inicio = inicioSemana(data);
    return { inicio, fim: somarDias(inicio, 7) };
  }
  const dias = gradeMes(data);
  return { inicio: dias[0], fim: somarDias(dias[41], 1) };
}

export function deslocar(visao: VisaoAgenda, data: string, direcao: -1 | 1) {
  if (visao === "dia") return somarDias(data, direcao);
  if (visao === "semana") return somarDias(data, 7 * direcao);
  const [ano, mes] = data.split("-").map(Number);
  const valor = new Date(Date.UTC(ano, mes - 1 + direcao, 1));
  return valor.toISOString().slice(0, 10);
}

export function diasDaVisao(visao: VisaoAgenda, data: string) {
  if (visao === "dia") return [data];
  if (visao === "semana") {
    const inicio = inicioSemana(data);
    return Array.from({ length: 7 }, (_, indice) => somarDias(inicio, indice));
  }
  return gradeMes(data);
}

export function rotuloPeriodo(visao: VisaoAgenda, data: string) {
  const formato = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
  if (visao === "mes") {
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(`${data.slice(0, 7)}-01T00:00:00Z`),
    );
  }
  if (visao === "dia") return formato.format(new Date(`${data}T00:00:00Z`));
  const inicio = inicioSemana(data);
  const fim = somarDias(inicio, 6);
  return `${formato.format(new Date(`${inicio}T00:00:00Z`))} – ${formato.format(new Date(`${fim}T00:00:00Z`))}`;
}

export function horaDoInstante(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function cruzaDia(inicio: string, fim: string, dia: string) {
  const de = new Date(`${dia}T00:00:00-03:00`).getTime();
  const ate = new Date(`${somarDias(dia, 1)}T00:00:00-03:00`).getTime();
  return new Date(inicio).getTime() < ate && new Date(fim).getTime() > de;
}

export function paraCampoDataHora(iso: string) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const pegar = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? "00";
  return `${pegar("year")}-${pegar("month")}-${pegar("day")}T${pegar("hour")}:${pegar("minute")}`;
}

export function deCampoDataHora(valor: string) {
  return new Date(`${valor}:00-03:00`).toISOString();
}

export function instanteDoDia(data: string, hora: string) {
  return `${data}T${hora}`;
}
