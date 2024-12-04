import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

export default function App() {
    // Estados para gerenciar o fluxo do aplicativo
    const [pais, setPais] = useState(null); // Armazena o nome do país
    const [tela, setTela] = useState("inicial"); // Define qual tela será exibida
    const [perguntas, setPerguntas] = useState([]); // Perguntas do quiz
    const [respostasUsuario, setRespostasUsuario] = useState({}); // Respostas do usuário
    const [pontuacao, setPontuacao] = useState(null); // Pontuação do usuário

    // Banco de perguntas para diferentes países
    const perguntasPorPais = {
        "Noruega": [
            { pergunta: "Qual é a capital da Noruega?", opcoes: ["Oslo", "Bergen", "Trondheim"], correta: "Oslo" },
            { pergunta: "Qual é o famoso fiorde norueguês?", opcoes: ["Geirangerfjord", "Milford Sound", "Fjordland"], correta: "Geirangerfjord" },
            { pergunta: "Que animal é símbolo da Noruega?", opcoes: ["Rena", "Urso Polar", "Alce"], correta: "Rena" }
        ],
        "Chile": [
            { pergunta: "Qual é a capital do Chile?", opcoes: ["Santiago", "Valparaíso", "Concepción"], correta: "Santiago" },
            { pergunta: "O deserto mais seco do mundo está no Chile. Qual é?", opcoes: ["Atacama", "Sahara", "Gobi"], correta: "Atacama" },
            { pergunta: "Qual é a montanha mais alta dos Andes Chilenos?", opcoes: ["Aconcágua", "Nevado Ojos del Salado", "Mont Blanc"], correta: "Nevado Ojos del Salado" }
        ],
        "Japão": [
            { pergunta: "Qual é a capital do Japão?", opcoes: ["Tóquio", "Osaka", "Kyoto"], correta: "Tóquio" },
            { pergunta: "O Japão é conhecido como a terra do?", opcoes: ["Sol Nascente", "Gelo Eterno", "Pôr do Sol"], correta: "Sol Nascente" },
            { pergunta: "Qual é a montanha mais alta do Japão?", opcoes: ["Monte Fuji", "Monte Everest", "Monte Aso"], correta: "Monte Fuji" }
        ]
    };

    // Obtém a localização do usuário e identifica o país
    useEffect(() => {
        const obterLocalizacao = async () => {
            // Solicita permissão para acessar a localização
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert("Permissão de localização negada. O quiz não pode ser carregado.");
                return;
            }

            // Obtém as coordenadas do usuário
            const localizacao = await Location.getCurrentPositionAsync({});
            console.log(localizacao);  // Verifique as coordenadas
            const latitude = localizacao.coords.latitude;
            const longitude = localizacao.coords.longitude;

            // Determina o país com base nas coordenadas
            const nomePais = await obterPais(latitude, longitude);
            console.log(nomePais); // Verifique o país detectado

            if (nomePais && perguntasPorPais[nomePais]) {
                setPais(nomePais); // Define o país atual
                setPerguntas(perguntasPorPais[nomePais]); // Define as perguntas para o país
            } else {
                setPais("Desconhecido"); // Caso o país não tenha perguntas
                setPerguntas([]); // Não exibe perguntas se o país for desconhecido
            }
        };

        const obterPais = async (lat, lon) => {
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
                const resposta = await axios.get(url);
                console.log(resposta.data);  // Verifique a resposta da API
                if (resposta.data && resposta.data.address && resposta.data.address.country) {
                    return resposta.data.address.country;
                } else {
                    console.error('Não foi possível determinar o país com as coordenadas');
                    return null;
                }
            } catch (error) {
                console.error("Erro ao obter o país:", error);
                return null;
            }
        };

        obterLocalizacao();
    }, []); // Apenas roda uma vez, quando o componente é montado

    // Envia as respostas do usuário e calcula a pontuação
    const enviarRespostas = () => {
        let acertos = 0;
 // Verifica quais respostas estão corretas
        perguntas.forEach((p, i) => {
            if (respostasUsuario[i] === p.correta) {
                acertos++;
            }
        });

        setPontuacao(acertos); // Define a pontuação final
        setTela("resultado"); // Altera para a tela de resultados
    };

    // Tela inicial
    if (tela === "inicial") {
        return (
            <View style={styles.container}>
                <Text style={styles.titulo}>Quiz Mundial</Text>
                <Text style={styles.texto}>
                    {pais ? `Você está no país: ${pais}` : "Detectando localização..."}
                </Text>
                <TouchableOpacity
                    style={styles.botao}
                    onPress={() => {
                        if (perguntas.length > 0) {
                            setTela("quiz");
                        } else {
                            alert("Desculpe, não temos perguntas para o seu país.");
                        }
                    }}
                >
                    <Text style={styles.textoBotao}>Iniciar Quiz</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Tela do quiz
    if (tela === "quiz") {
        return (
            <View style={styles.container}>
                <FlatList
                    data={perguntas}
                    renderItem={({ item, index }) => (
                        <View style={styles.perguntaContainer}>
                            <Text style={styles.perguntaTexto}>{item.pergunta}</Text>
                            {item.opcoes.map((opcao, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.opcaoBotao, respostasUsuario[index] === opcao && styles.opcaoSelecionada]}
                                    onPress={() => setRespostasUsuario({ ...respostasUsuario, [index]: opcao })}
                                >
                                    <Text>{opcao}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    keyExtractor={(_, index) => index.toString()}
                />
                <TouchableOpacity style={styles.botao} onPress={enviarRespostas}>
                    <Text style={styles.textoBotao}>Enviar Respostas</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Tela de resultados
    if (tela === "resultado") {
        return (
            <View style={styles.container}>
                <Text style={styles.titulo}>Resultado</Text>
                <Text style={styles.texto}>
                    Você acertou {pontuacao} de {perguntas.length} perguntas.
                </Text>
                <TouchableOpacity style={styles.botao} onPress={() => setTela("inicial")}>
                    <Text style={styles.textoBotao}>Voltar ao Início</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return null;
}
// Estilos do aplicativo
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        padding: 20,
    },
    titulo: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#2e7d32',
    },
    texto: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
    botao: {
        backgroundColor: '#2e7d32',
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
        width: '60%',
        alignItems: 'center',
    },
    textoBotao: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    perguntaContainer: {
        marginBottom: 20,
    },
    perguntaTexto: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    opcaoBotao: {
        backgroundColor: '#a5d6a7',
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
        alignItems: 'center',
    },
    opcaoSelecionada: {
        backgroundColor: '#2e7d32',
    },
});
