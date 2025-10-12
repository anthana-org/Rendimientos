// Imports comentados temporalmente

// Comentado temporalmente para evitar errores de build
/*
export class RendimientoGenerator {
  static async generateRendimientosForAllUsers(): Promise<{ success: boolean; generated?: number; error?: string }> {
    try {
      // Obtener todos los contratos
      const contractsResult = await ContractService.getAllContracts();
      if (!contractsResult.success || !contractsResult.data) {
        return { success: false, error: 'Error obteniendo contratos' };
      }

      const contracts = contractsResult.data;
      let totalGenerated = 0;

      // Agrupar contratos por usuario
      const userContracts = new Map<string, any[]>();
      contracts.forEach(contract => {
        if (!userContracts.has(contract.userId)) {
          userContracts.set(contract.userId, []);
        }
        userContracts.get(contract.userId)!.push(contract);
      });

      // Generar rendimientos para cada usuario
      for (const [userId, userContractsList] of userContracts) {
        for (const contract of userContractsList) {
          // Generar rendimientos mensuales - cada mes es un contrato independiente
          const startDate = new Date(contract.startDate);
          const endDate = new Date(contract.expirationDate);
          const today = new Date();

          // Solo generar rendimientos para contratos que han comenzado
          if (startDate > today) continue;

          // Determinar la fecha final (menor entre fecha de vencimiento y hoy)
          const finalDate = endDate < today ? endDate : today;

          // Generar rendimientos mes por mes - cada mes es un contrato mensual
          let currentDate = new Date(startDate);
          let monthCounter = 1;
          
          while (currentDate <= finalDate) {
            const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            
            // Para contratos mensuales, el capital se mantiene igual cada mes
            // pero el rendimiento se calcula sobre el capital del mes
            const monthlyReturnAmount = (contract.investmentAmount * contract.monthlyReturn) / 100;
            const balance = contract.investmentAmount + monthlyReturnAmount; // Balance mensual

            const rendimientoData = {
              userId: userId,
              period: period,
              capital: contract.investmentAmount, // Capital del mes
              rendimientoPercent: contract.monthlyReturn,
              rendimientoAmount: monthlyReturnAmount, // Ganancia del mes
              balance: balance, // Capital + ganancia del mes
              notes: `Rendimiento mensual ${monthCounter} de ${contract.contractType}`,
              contractId: contract.id,
              monthNumber: monthCounter // Número del mes del contrato
            };

            // Verificar si ya existe este rendimiento
            const existingResult = await RendimientosService.getRendimientosByUser(userId);
            if (existingResult.success && existingResult.data) {
              const exists = existingResult.data.some(r => r.periodo === period && r.contractId === contract.id && r.monthNumber === monthCounter);
              if (exists) {
                // Mover al siguiente mes
                currentDate.setMonth(currentDate.getMonth() + 1);
                monthCounter++;
                continue;
              }
            }

            // Crear el rendimiento mensual
            const result = await RendimientosService.createRendimiento(rendimientoData);
            if (result.success) {
              totalGenerated++;
            }

            // Mover al siguiente mes
            currentDate.setMonth(currentDate.getMonth() + 1);
            monthCounter++;
          }
        }
      }

      return { success: true, generated: totalGenerated };
    } catch (error: any) {
      console.error('Error generando rendimientos:', error);
      return { success: false, error: error.message };
    }
  }

  private static getMonthsDifference(startDate: Date, currentDate: Date): number {
    const yearDiff = currentDate.getFullYear() - startDate.getFullYear();
    const monthDiff = currentDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff + 1; // +1 para incluir el mes actual
  }

  static async generateRendimientosForUser(userId: string): Promise<{ success: boolean; generated?: number; error?: string }> {
    try {
      // Obtener contratos del usuario
      const contractsResult = await ContractService.getContractsByUser(userId);
      if (!contractsResult.success || !contractsResult.data) {
        return { success: false, error: 'Error obteniendo contratos del usuario' };
      }

      const contracts = contractsResult.data;
      let totalGenerated = 0;

        for (const contract of contracts) {
          // Generar rendimientos mensuales - cada mes es un contrato independiente
          const startDate = new Date(contract.startDate);
          const endDate = new Date(contract.expirationDate);
          const today = new Date();

          // Solo generar rendimientos para contratos que han comenzado
          if (startDate > today) continue;

          // Determinar la fecha final (menor entre fecha de vencimiento y hoy)
          const finalDate = endDate < today ? endDate : today;

          // Generar rendimientos mes por mes - cada mes es un contrato mensual
          let currentDate = new Date(startDate);
          let monthCounter = 1;
          
          while (currentDate <= finalDate) {
            const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            
            // Para contratos mensuales, el capital se mantiene igual cada mes
            const monthlyReturnAmount = (contract.investmentAmount * contract.monthlyReturn) / 100;
            const balance = contract.investmentAmount + monthlyReturnAmount; // Balance mensual

            const rendimientoData = {
              userId: userId,
              period: period,
              capital: contract.investmentAmount, // Capital del mes
              rendimientoPercent: contract.monthlyReturn,
              rendimientoAmount: monthlyReturnAmount, // Ganancia del mes
              balance: balance, // Capital + ganancia del mes
              notes: `Rendimiento mensual ${monthCounter} de ${contract.contractType}`,
              contractId: contract.id,
              monthNumber: monthCounter // Número del mes del contrato
            };

            // Verificar si ya existe este rendimiento
            const existingResult = await RendimientosService.getRendimientosByUser(userId);
            if (existingResult.success && existingResult.data) {
              const exists = existingResult.data.some(r => r.periodo === period && r.contractId === contract.id && r.monthNumber === monthCounter);
              if (exists) {
                // Mover al siguiente mes
                currentDate.setMonth(currentDate.getMonth() + 1);
                monthCounter++;
                continue;
              }
            }

            // Crear el rendimiento mensual
            const result = await RendimientosService.createRendimiento(rendimientoData);
            if (result.success) {
              totalGenerated++;
            }

            // Mover al siguiente mes
            currentDate.setMonth(currentDate.getMonth() + 1);
            monthCounter++;
          }
        }

      return { success: true, generated: totalGenerated };
    } catch (error: any) {
      console.error('Error generando rendimientos para usuario:', error);
      return { success: false, error: error.message };
    }
  }
}
*/
