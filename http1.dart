import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> fetchMetrics() async {
  final response = await http.get(Uri.parse("http://localhost:5000/metrics"));

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    print("Total Vendas: ${data['totalSales']}");
    print("Total Pedidos: ${data['totalOrders']}");
  } else {
    print("Erro ao buscar métricas!");
  }
}
