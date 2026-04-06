import { Project, Milestone } from '@/types'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, borderBottomWidth: 1, borderBottomColor: '#CCC', paddingBottom: 5, marginBottom: 10, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  label: { fontSize: 11, color: '#444', width: '30%' },
  value: { fontSize: 11, width: '70%', textAlign: 'right' },
  milestoneRow: { flexDirection: 'row', marginVertical: 4 },
  milestoneTitle: { fontSize: 12, width: '60%' },
  milestoneDate: { fontSize: 10, width: '20%', color: '#666' },
  milestoneStatus: { fontSize: 10, width: '20%', textAlign: 'right' },
  activityText: { fontSize: 10, marginBottom: 4 }
})

export async function generateProjectPDF(
  project: Project,
  milestones: Milestone[],
  activities: any[]
): Promise<Blob> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{project.name}</Text>
          <Text style={styles.subtitle}>Project Status Report - {format(new Date(), 'MMM d, yyyy')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Overview</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{project.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Health</Text>
            <Text style={styles.value}>{project.health}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Progress</Text>
            <Text style={styles.value}>{project.progress}% Complete</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{project.description || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          {milestones?.map((m) => (
            <View key={m.id} style={styles.milestoneRow}>
              <Text style={styles.milestoneTitle}>{m.title}</Text>
              <Text style={styles.milestoneDate}>{format(new Date(m.due_date), 'MMM d, yyyy')}</Text>
              <Text style={styles.milestoneStatus}>{m.status}</Text>
            </View>
          ))}
          {(!milestones || milestones.length === 0) && (
            <Text style={{ fontSize: 10, color: '#666' }}>No milestones recorded.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activities?.slice(0, 10).map((a) => (
            <Text key={a.id} style={styles.activityText}>
              • {a.user?.name || 'Someone'} {a.message} ({format(new Date(a.created_at), 'MMM d, yyyy')})
            </Text>
          ))}
           {(!activities || activities.length === 0) && (
            <Text style={{ fontSize: 10, color: '#666' }}>No activity recorded.</Text>
          )}
        </View>
      </Page>
    </Document>
  )

  return await pdf(doc).toBlob()
}
