import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { PdfDocument } from 'react-native-pdf-editor';

export default function App() {
  const [status, setStatus] = useState('Creating document...');

  useEffect(() => {
    try {
      const doc = PdfDocument.create();
      const page = doc.createPage(612, 792);
      const painter = page.createPainter();
      const font = doc.getStandard14Font('Helvetica');
      painter.setFont(font, 24);
      painter.drawText('Hello from react-native-pdf-editor!', 50, 700);
      painter.finishDrawing();
      setStatus(`Created a ${doc.pageCount}-page document.`);
    } catch (error) {
      setStatus(`Error: ${String(error)}`);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
