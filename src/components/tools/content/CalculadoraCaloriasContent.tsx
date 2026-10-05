export function CalculadoraCaloriasContent() {
  return (
    <article className="prose prose-neutral prose-violet max-w-none">
      <p>
        Entender cuántas calorías necesita tu cuerpo cada día es el primer paso para cualquier objetivo de composición corporal, ya sea mantener tu peso, ganar masa muscular o perder grasa. Nuestra calculadora utiliza la <strong>fórmula de Mifflin-St Jeor</strong>, considerada actualmente como la más precisa para estimar el metabolismo basal en la población general.
      </p>

      <h3>¿Qué es el Metabolismo Basal (BMR)?</h3>
      <p>
        La Tasa Metabólica Basal (BMR por sus siglas en inglés) representa la cantidad mínima de energía que tu cuerpo necesita para realizar sus funciones vitales básicas mientras está en completo reposo. Esto incluye procesos como la respiración, la circulación sanguínea, el funcionamiento de los órganos y el mantenimiento de la temperatura corporal.
      </p>
      <p>
        Incluso si estuvieras todo el día recostado sin moverte, tu cuerpo quemaría estas calorías simplemente para mantenerte con vida. El BMR representa, en la mayoría de las personas, entre el 60% y el 75% del gasto energético total diario.
      </p>

      <h3>¿Qué es el Gasto Energético Diario (TDEE)?</h3>
      <p>
        El TDEE (Total Daily Energy Expenditure) es el número total de calorías que quemas en un día. Se calcula multiplicando tu BMR por un factor de actividad física. Este número representa tus <strong>calorías de mantenimiento</strong>.
      </p>
      
      <p>El TDEE incluye:</p>
      <ul>
        <li><strong>Tu BMR</strong> (energía basal).</li>
        <li><strong>NEAT (Non-Exercise Activity Thermogenesis):</strong> Energía gastada en movimientos cotidianos no deportivos (caminar al trabajo, limpiar, moverse en la silla).</li>
        <li><strong>TEF (Termogénesis Inducida por la Dieta):</strong> La energía que tu cuerpo usa para digerir y procesar los alimentos.</li>
        <li><strong>EAT (Exercise Activity Thermogenesis):</strong> Las calorías quemadas específicamente durante el ejercicio voluntario.</li>
      </ul>

      <h3>¿Cómo usar la calculadora para tu objetivo?</h3>
      
      <h4>Para mantener el peso</h4>
      <p>
        Si tu objetivo es mantener tu peso actual y tu composición corporal, debes consumir aproximadamente la misma cantidad de calorías que tu <strong>Gasto Energético Diario (TDEE)</strong>.
      </p>

      <h4>Para perder grasa (Déficit Calórico)</h4>
      <p>
        Para perder peso, necesitas consumir menos calorías de las que quemas. Un déficit saludable y sostenible suele estar entre <strong>300 y 500 calorías por debajo de tu TDEE</strong>. Esto generalmente resulta en una pérdida de peso constante sin comprometer significativamente la masa muscular o los niveles de energía.
      </p>

      <h4>Para ganar masa muscular (Superávit Calórico)</h4>
      <p>
        Para construir músculo nuevo, tu cuerpo necesita un excedente de energía. Un superávit de <strong>200 a 500 calorías por encima de tu TDEE</strong>, combinado con entrenamiento de fuerza progresivo y suficiente proteína, es ideal para promover la hipertrofia muscular minimizando la ganancia de grasa.
      </p>

      <div className="bg-neutral-50 border-l-4 border-neutral-900 p-6 rounded-r-xl my-8">
        <h4 className="text-neutral-900 mt-0">Importante sobre las estimaciones</h4>
        <p className="mb-0 text-neutral-700">
          Recordá que cualquier calculadora online proporciona <strong>estimaciones matemáticas</strong> basadas en promedios poblacionales. Tu metabolismo real puede ser ligeramente más rápido o más lento dependiendo de factores genéticos, tu historial de dietas, y principalmente, tu porcentaje de masa muscular (el músculo quema más calorías en reposo que la grasa). Utilizá este número como un punto de partida y ajustá tu ingesta basándote en cómo responde tu cuerpo en la vida real después de 2 o 3 semanas.
        </p>
      </div>
    </article>
  );
}


